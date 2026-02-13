import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { formatAgeBucket, formatAgeRangeMonths, monthInputIsValid, monthsFromYearsMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { AgeBucket, AgeDistributionItem, CoverageItem, School } from '../../types/api';

interface DashboardsPageProps {
  adminMode?: boolean;
}

interface DashboardFilters {
  q: string;
  schoolId: string;
  status: string;
  sex: string;
  ageMinYears: string;
  ageMinMonths: string;
  ageMaxYears: string;
  ageMaxMonths: string;
}

const EMPTY_FILTERS: DashboardFilters = {
  q: '',
  schoolId: '',
  status: '',
  sex: '',
  ageMinYears: '',
  ageMinMonths: '',
  ageMaxYears: '',
  ageMaxMonths: '',
};

const DEFAULT_EDITOR_BUCKET: AgeBucket = { label: '', minMonths: 0, maxMonths: 0 };

export function DashboardsPage({ adminMode = false }: DashboardsPageProps) {
  const [loading, setLoading] = React.useState(false);
  const [coverage, setCoverage] = React.useState<CoverageItem[]>([]);
  const [ranking, setRanking] = React.useState<CoverageItem[]>([]);
  const [ageDistribution, setAgeDistribution] = React.useState<AgeDistributionItem[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);

  const [filters, setFilters] = React.useState<DashboardFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<DashboardFilters>(EMPTY_FILTERS);

  const [anonymizedExport, setAnonymizedExport] = React.useState(false);

  const [ageBuckets, setAgeBuckets] = React.useState<AgeBucket[]>([]);
  const [isBucketModalOpen, setIsBucketModalOpen] = React.useState(false);
  const [bucketForm, setBucketForm] = React.useState<AgeBucket>(DEFAULT_EDITOR_BUCKET);
  const [editingBucketIndex, setEditingBucketIndex] = React.useState<number | null>(null);

  const buildQuery = React.useCallback((source: DashboardFilters) => {
    const ageMin = monthsFromYearsMonths(source.ageMinYears, source.ageMinMonths);
    const ageMax = monthsFromYearsMonths(source.ageMaxYears, source.ageMaxMonths);

    return {
      q: source.q || undefined,
      schoolId: source.schoolId ? Number(source.schoolId) : undefined,
      status: source.status || undefined,
      sex: (source.sex || undefined) as 'F' | 'M' | 'NI' | undefined,
      ageMin,
      ageMax,
    };
  }, []);

  const load = React.useCallback(async () => {
    if (!monthInputIsValid(appliedFilters.ageMinMonths) || !monthInputIsValid(appliedFilters.ageMaxMonths)) {
      toast.error('Meses devem ficar entre 0 e 11.');
      return;
    }

    setLoading(true);
    try {
      const query = buildQuery(appliedFilters);
      const [coverageItems, rankingItems, ageItems] = await Promise.all([
        api.getCoverageFiltered(query),
        api.getRankingFiltered(query),
        api.getAgeDistributionFiltered(query),
      ]);
      setCoverage(coverageItems);
      setRanking(rankingItems);
      setAgeDistribution(ageItems);
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao carregar dashboards.'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, buildQuery]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void (async () => {
      try {
        const [schoolsData, bucketsData] = await Promise.all([api.listSchools(), api.getAgeBucketsPreference()]);
        setSchools(schoolsData);
        setAgeBuckets(bucketsData);
      } catch (error) {
        toast.error(parseApiError(error, 'Não foi possível carregar metadados do dashboard.'));
      }
    })();
  }, []);

  const averageCoverage = coverage.length
    ? coverage.reduce((acc, item) => acc + item.coveragePercent, 0) / coverage.length
    : 0;

  const totalPending = coverage.reduce((acc, item) => acc + item.ATRASADO + item.INCOMPLETO + item.SEM_DADOS, 0);
  const totalStudents = coverage.reduce((acc, item) => acc + item.totalStudents, 0);

  const chartData = ageDistribution.map((item) => ({
    faixa: formatAgeBucket(item.ageBucket),
    pendentes: item.pendingCount,
    atrasadas: item.overdueCount,
  }));

  const exportCsv = async () => {
    try {
      const query = buildQuery(appliedFilters);
      const blob = await api.exportPendingCsv(query, anonymizedExport);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = anonymizedExport ? 'students_pending_anonymized.csv' : 'students_pending.csv';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao exportar relatório.'));
    }
  };

  const applyFilters = () => {
    if (!monthInputIsValid(filters.ageMinMonths) || !monthInputIsValid(filters.ageMaxMonths)) {
      toast.error('Meses devem ficar entre 0 e 11.');
      return;
    }
    setAppliedFilters(filters);
  };

  const openCreateBucket = () => {
    setEditingBucketIndex(null);
    setBucketForm(DEFAULT_EDITOR_BUCKET);
    setIsBucketModalOpen(true);
  };

  const openEditBucket = (bucket: AgeBucket, index: number) => {
    setEditingBucketIndex(index);
    setBucketForm(bucket);
    setIsBucketModalOpen(true);
  };

  const saveBucket = () => {
    if (!bucketForm.label.trim()) {
      toast.error('Informe um rótulo para a faixa etária.');
      return;
    }
    if (bucketForm.minMonths < 0 || bucketForm.maxMonths < bucketForm.minMonths) {
      toast.error('Faixa etária inválida.');
      return;
    }

    const updated = [...ageBuckets];
    if (editingBucketIndex === null) {
      updated.push(bucketForm);
    } else {
      updated[editingBucketIndex] = bucketForm;
    }
    updated.sort((a, b) => a.minMonths - b.minMonths);

    for (let i = 1; i < updated.length; i += 1) {
      if (updated[i].minMonths <= updated[i - 1].maxMonths) {
        toast.error('As faixas etárias não podem se sobrepor.');
        return;
      }
    }

    setAgeBuckets(updated);
    setIsBucketModalOpen(false);
  };

  const deleteBucket = (index: number) => {
    const updated = ageBuckets.filter((_, currentIndex) => currentIndex !== index);
    setAgeBuckets(updated);
  };

  const saveBucketPreferences = async () => {
    if (ageBuckets.length === 0) {
      toast.error('Cadastre ao menos uma faixa etária.');
      return;
    }
    try {
      const saved = await api.updateAgeBucketsPreference(ageBuckets);
      setAgeBuckets(saved);
      toast.success('Faixas etárias salvas.');
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível salvar faixas etárias.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">{adminMode ? 'Painel administrativo' : 'Painel de saúde'}</h1>
          <p className="text-gray-500">Cobertura por escola, ranking e distribuição de pendências por faixa etária.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openCreateBucket}>
            <Plus className="mr-2 h-4 w-4" />
            Nova faixa etária
          </Button>
          <Button variant="outline" onClick={() => void saveBucketPreferences()}>
            <Edit className="mr-2 h-4 w-4" />
            Salvar faixas
          </Button>
          <Button variant="outline" onClick={() => void exportCsv()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar relatório
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Input label="Nome" value={filters.q} onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))} />
          <Select label="Escola" value={filters.schoolId} onChange={(event) => setFilters((prev) => ({ ...prev, schoolId: event.target.value }))}>
            <option value="">Todas</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </Select>
          <Select label="Status" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="">Todos</option>
            <option value="EM_DIA">Em dia</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="INCOMPLETO">Incompleto</option>
            <option value="SEM_DADOS">Sem dados</option>
          </Select>
          <Select label="Sexo" value={filters.sex} onChange={(event) => setFilters((prev) => ({ ...prev, sex: event.target.value }))}>
            <option value="">Todos</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="NI">Não informado</option>
          </Select>
          <label className="inline-flex items-end gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={anonymizedExport} onChange={(event) => setAnonymizedExport(event.target.checked)} />
            Exportar anonimizado
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input
            label="Idade mínima (anos)"
            type="number"
            min={0}
            value={filters.ageMinYears}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMinYears: event.target.value }))}
          />
          <Input
            label="Idade mínima (meses)"
            type="number"
            min={0}
            max={11}
            value={filters.ageMinMonths}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMinMonths: event.target.value }))}
          />
          <Input
            label="Idade máxima (anos)"
            type="number"
            min={0}
            value={filters.ageMaxYears}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMaxYears: event.target.value }))}
          />
          <Input
            label="Idade máxima (meses)"
            type="number"
            min={0}
            max={11}
            value={filters.ageMaxMonths}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMaxMonths: event.target.value }))}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={applyFilters}>Aplicar filtros</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Cobertura média</p>
          <h3 className="mt-2 text-3xl font-bold text-[#0B5D7A]">{averageCoverage.toFixed(1)}%</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Escolas monitoradas</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{coverage.length}</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Pendências totais</p>
          <h3 className="mt-2 text-3xl font-bold text-[#E76F51]">{totalPending}</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Estudantes no consolidado</p>
          <h3 className="mt-2 text-3xl font-bold text-[#2A9D8F]">{totalStudents}</h3>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de pendências por faixa etária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pendentes" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atrasadas" fill="#E76F51" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobertura por escola</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escola</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {ranking.map((item) => (
                  <TableRow key={item.schoolId}>
                    <TableCell className="font-medium">{item.schoolName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.coveragePercent.toFixed(1)}%</span>
                        <div className="h-2 w-24 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.coveragePercent}%`,
                              backgroundColor: item.coveragePercent >= 80 ? '#2A9D8F' : item.coveragePercent >= 60 ? '#F4A261' : '#E76F51',
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge status={item.coveragePercent >= 80 ? 'EM_DIA' : item.coveragePercent >= 60 ? 'INCOMPLETO' : 'ATRASADO'} />
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
            {ranking.length === 0 ? <div className="pt-4 text-center text-sm text-gray-500">Sem dados de ranking.</div> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faixas etárias configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rótulo</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Máximo</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {ageBuckets.map((bucket, index) => (
                <TableRow key={`${bucket.label}-${index}`}>
                  <TableCell>{bucket.label}</TableCell>
                  <TableCell>{bucket.minMonths}</TableCell>
                  <TableCell>{bucket.maxMonths}</TableCell>
                  <TableCell>{formatAgeRangeMonths(bucket.minMonths, bucket.maxMonths)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditBucket(bucket, index)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBucket(index)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      {loading ? <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-gray-500">Atualizando indicadores...</div> : null}

      <Modal
        isOpen={isBucketModalOpen}
        onClose={() => setIsBucketModalOpen(false)}
        title={editingBucketIndex === null ? 'Nova faixa etária' : 'Editar faixa etária'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsBucketModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveBucket}>Salvar</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input label="Rótulo" value={bucketForm.label} onChange={(event) => setBucketForm((prev) => ({ ...prev, label: event.target.value }))} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Mínimo (meses)"
              type="number"
              min={0}
              value={bucketForm.minMonths}
              onChange={(event) => setBucketForm((prev) => ({ ...prev, minMonths: Number(event.target.value) }))}
            />
            <Input
              label="Máximo (meses)"
              type="number"
              min={0}
              value={bucketForm.maxMonths}
              onChange={(event) => setBucketForm((prev) => ({ ...prev, maxMonths: Number(event.target.value) }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
