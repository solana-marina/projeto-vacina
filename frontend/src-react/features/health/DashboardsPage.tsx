import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { formatAgeBucket, formatAgeMonths, formatAgeRangeMonths, monthInputIsValid, monthsFromYearsMonths, splitMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { AgeBucket, AgeDistributionItem, CoverageItem, School, Vaccine } from '../../types/api';

interface DashboardsPageProps {
  adminMode?: boolean;
}

interface DashboardFilters {
  schoolId: string;
  vaccineId: string;
  status: string;
  sex: string;
  ageMinYears: string;
  ageMinMonths: string;
  ageMaxYears: string;
  ageMaxMonths: string;
}

interface AgeBucketForm {
  label: string;
  minYears: string;
  minMonths: string;
  maxYears: string;
  maxMonths: string;
}

const EMPTY_FILTERS: DashboardFilters = {
  schoolId: '',
  vaccineId: '',
  status: '',
  sex: '',
  ageMinYears: '',
  ageMinMonths: '',
  ageMaxYears: '',
  ageMaxMonths: '',
};

const EMPTY_BUCKET_FORM: AgeBucketForm = {
  label: '',
  minYears: '0',
  minMonths: '0',
  maxYears: '0',
  maxMonths: '0',
};

function HelpHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-gray-500">
      ?
      <span className="pointer-events-none absolute left-6 top-1/2 z-20 hidden w-72 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs font-normal text-gray-700 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function bucketToForm(bucket: AgeBucket): AgeBucketForm {
  const min = splitMonths(bucket.minMonths);
  const max = splitMonths(bucket.maxMonths);
  return {
    label: bucket.label,
    minYears: String(min.years),
    minMonths: String(min.months),
    maxYears: String(max.years),
    maxMonths: String(max.months),
  };
}

function formToBucket(form: AgeBucketForm): AgeBucket | null {
  const minMonths = monthsFromYearsMonths(form.minYears, form.minMonths);
  const maxMonths = monthsFromYearsMonths(form.maxYears, form.maxMonths);
  if (minMonths === undefined || maxMonths === undefined) {
    return null;
  }
  return {
    label: form.label.trim(),
    minMonths,
    maxMonths,
  };
}

export function DashboardsPage({ adminMode = false }: DashboardsPageProps) {
  const [loading, setLoading] = React.useState(false);
  const [coverage, setCoverage] = React.useState<CoverageItem[]>([]);
  const [ranking, setRanking] = React.useState<CoverageItem[]>([]);
  const [ageDistribution, setAgeDistribution] = React.useState<AgeDistributionItem[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);
  const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);

  const [filters, setFilters] = React.useState<DashboardFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<DashboardFilters>(EMPTY_FILTERS);

  const [ageBuckets, setAgeBuckets] = React.useState<AgeBucket[]>([]);
  const [isBucketModalOpen, setIsBucketModalOpen] = React.useState(false);
  const [bucketForm, setBucketForm] = React.useState<AgeBucketForm>(EMPTY_BUCKET_FORM);
  const [editingBucketIndex, setEditingBucketIndex] = React.useState<number | null>(null);

  const buildQuery = React.useCallback((source: DashboardFilters) => {
    const ageMin = monthsFromYearsMonths(source.ageMinYears, source.ageMinMonths);
    const ageMax = monthsFromYearsMonths(source.ageMaxYears, source.ageMaxMonths);

    return {
      schoolId: source.schoolId ? Number(source.schoolId) : undefined,
      vaccineId: source.vaccineId ? Number(source.vaccineId) : undefined,
      status: source.status || undefined,
      sex: (source.sex || undefined) as 'F' | 'M' | 'NI' | undefined,
      ageMin,
      ageMax,
    };
  }, []);

  const load = React.useCallback(async () => {
    if (!monthInputIsValid(appliedFilters.ageMinMonths) || !monthInputIsValid(appliedFilters.ageMaxMonths)) {
      toast.error('Os campos de meses devem estar entre 0 e 11.');
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
        const [schoolsData, bucketsData, vaccineItems] = await Promise.all([
          api.listSchools(),
          api.getAgeBucketsPreference(),
          api.listVaccines(),
        ]);
        setSchools(schoolsData);
        setAgeBuckets(bucketsData);
        setVaccines(vaccineItems);
      } catch (error) {
        toast.error(parseApiError(error, 'Nao foi possivel carregar metadados do dashboard.'));
      }
    })();
  }, []);

  const averageCoverage = coverage.length
    ? coverage.reduce((acc, item) => acc + item.coveragePercent, 0) / coverage.length
    : 0;

  const totalPending = coverage.reduce((acc, item) => acc + item.ATRASADO + item.INCOMPLETO, 0);
  const totalStudents = coverage.reduce((acc, item) => acc + item.totalStudents, 0);

  const chartData = ageDistribution.map((item) => ({
    faixa: formatAgeBucket(item.ageBucket),
    emDia: item.upToDateCount ?? 0,
    pendentes: item.pendingCount,
    atrasadas: item.overdueCount,
  }));

  const exportCsv = async (anonymized = false) => {
    try {
      const query = buildQuery(appliedFilters);
      const blob = await api.exportPendingCsv(query, anonymized);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = anonymized ? 'students_pending_anonymized.csv' : 'students_pending.csv';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao exportar relatorio.'));
    }
  };

  const applyFilters = () => {
    if (!monthInputIsValid(filters.ageMinMonths) || !monthInputIsValid(filters.ageMaxMonths)) {
      toast.error('Os campos de meses devem estar entre 0 e 11.');
      return;
    }
    setAppliedFilters(filters);
  };

  const openCreateBucket = () => {
    setEditingBucketIndex(null);
    setBucketForm(EMPTY_BUCKET_FORM);
    setIsBucketModalOpen(true);
  };

  const openEditBucket = (bucket: AgeBucket, index: number) => {
    setEditingBucketIndex(index);
    setBucketForm(bucketToForm(bucket));
    setIsBucketModalOpen(true);
  };

  const saveBucket = () => {
    if (!bucketForm.label.trim()) {
      toast.error('Informe um rotulo para a faixa etaria.');
      return;
    }
    if (!monthInputIsValid(bucketForm.minMonths) || !monthInputIsValid(bucketForm.maxMonths)) {
      toast.error('Os campos de meses devem estar entre 0 e 11.');
      return;
    }

    const parsedBucket = formToBucket(bucketForm);
    if (!parsedBucket || parsedBucket.maxMonths < parsedBucket.minMonths) {
      toast.error('Faixa etaria invalida. A idade maxima deve ser maior ou igual a minima.');
      return;
    }

    const updated = [...ageBuckets];
    if (editingBucketIndex === null) {
      updated.push(parsedBucket);
    } else {
      updated[editingBucketIndex] = parsedBucket;
    }
    updated.sort((a, b) => a.minMonths - b.minMonths);

    for (let i = 1; i < updated.length; i += 1) {
      if (updated[i].minMonths <= updated[i - 1].maxMonths) {
        toast.error('As faixas etarias nao podem se sobrepor.');
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
      toast.error('Cadastre ao menos uma faixa etaria.');
      return;
    }
    try {
      const saved = await api.updateAgeBucketsPreference(ageBuckets);
      setAgeBuckets(saved);
      toast.success('Faixas etarias salvas.');
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Nao foi possivel salvar faixas etarias.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">{adminMode ? 'Painel administrativo' : 'Painel de saude'}</h1>
          <p className="text-gray-500">Cobertura por escola, ranking e distribuicao de pendencias por faixa etaria.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void exportCsv(false)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar relatorio
          </Button>
          <Button variant="outline" onClick={() => void exportCsv(true)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar anonimizado
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Select label="Escola" value={filters.schoolId} onChange={(event) => setFilters((prev) => ({ ...prev, schoolId: event.target.value }))}>
            <option value="">Todas</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </Select>
          <Select label="Vacina" value={filters.vaccineId} onChange={(event) => setFilters((prev) => ({ ...prev, vaccineId: event.target.value }))}>
            <option value="">Todas</option>
            {vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>
                {vaccine.code} - {vaccine.name}
              </option>
            ))}
          </Select>
          <Select
            label={
              <span className="inline-flex items-center gap-1">
                Status
                <HelpHint text="Em dia: sem dose pendente para a idade atual. Pendente: ha dose liberada por idade que ainda nao foi registrada. Atrasado: ha dose pendente e o prazo maximo ja passou. Sem dados: nenhum registro vacinal." />
              </span>
            }
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">Todos</option>
            <option value="EM_DIA">Em dia</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="INCOMPLETO">Pendente</option>
            <option value="SEM_DADOS">Sem dados</option>
          </Select>
          <Select label="Sexo" value={filters.sex} onChange={(event) => setFilters((prev) => ({ ...prev, sex: event.target.value }))}>
            <option value="">Todos</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="NI">Nao informado</option>
          </Select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input
            label="Idade minima (anos)"
            type="number"
            min={0}
            value={filters.ageMinYears}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMinYears: event.target.value }))}
          />
          <Input
            label="Idade minima (meses)"
            type="number"
            min={0}
            max={11}
            value={filters.ageMinMonths}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMinMonths: event.target.value }))}
          />
          <Input
            label="Idade maxima (anos)"
            type="number"
            min={0}
            value={filters.ageMaxYears}
            onChange={(event) => setFilters((prev) => ({ ...prev, ageMaxYears: event.target.value }))}
          />
          <Input
            label="Idade maxima (meses)"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-gray-500">Cobertura media</p>
            <HelpHint text="Percentual medio de estudantes em dia no recorte filtrado." />
          </div>
          <h3 className="mt-2 text-3xl font-bold text-[#0B5D7A]">{averageCoverage.toFixed(1)}%</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Escolas monitoradas</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{coverage.length}</h3>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-gray-500">Pendencias totais</p>
            <HelpHint text="Soma de estudantes com status Pendente e Atrasado. Nao inclui Sem dados." />
          </div>
          <h3 className="mt-2 text-3xl font-bold text-[#E76F51]">{totalPending}</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Estudantes no consolidado</p>
          <h3 className="mt-2 text-3xl font-bold text-[#2A9D8F]">{totalStudents}</h3>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Distribuicao de pendencias por faixa etaria</CardTitle>
            <HelpHint text="Em dia: estudantes sem dose pendente na idade atual. Pendentes: doses liberadas para a idade atual e ainda nao registradas. Atrasadas: doses pendentes com idade acima da faixa maxima recomendada." />
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
                  <Bar dataKey="emDia" name="Em dia" fill="#0B5D7A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendentes" fill="#F4A261" radius={[4, 4, 0, 0]} />
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
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Faixas etarias configuradas</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openCreateBucket}>
              <Plus className="mr-2 h-4 w-4" />
              Nova faixa etaria
            </Button>
            <Button variant="outline" onClick={() => void saveBucketPreferences()}>
              <Edit className="mr-2 h-4 w-4" />
              Salvar faixas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rotulo</TableHead>
                <TableHead>Minimo</TableHead>
                <TableHead>Maximo</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {ageBuckets.map((bucket, index) => (
                <TableRow key={`${bucket.label}-${index}`}>
                  <TableCell>{bucket.label}</TableCell>
                  <TableCell>{formatAgeMonths(bucket.minMonths)}</TableCell>
                  <TableCell>{formatAgeMonths(bucket.maxMonths)}</TableCell>
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
        title={editingBucketIndex === null ? 'Nova faixa etaria' : 'Editar faixa etaria'}
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
          <Input label="Rotulo" value={bucketForm.label} onChange={(event) => setBucketForm((prev) => ({ ...prev, label: event.target.value }))} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Minimo (anos)"
              type="number"
              min={0}
              value={bucketForm.minYears}
              onChange={(event) => setBucketForm((prev) => ({ ...prev, minYears: event.target.value }))}
            />
            <Input
              label="Minimo (meses)"
              type="number"
              min={0}
              max={11}
              value={bucketForm.minMonths}
              onChange={(event) => setBucketForm((prev) => ({ ...prev, minMonths: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Maximo (anos)"
              type="number"
              min={0}
              value={bucketForm.maxYears}
              onChange={(event) => setBucketForm((prev) => ({ ...prev, maxYears: event.target.value }))}
            />
            <Input
              label="Maximo (meses)"
              type="number"
              min={0}
              max={11}
              value={bucketForm.maxMonths}
              onChange={(event) => setBucketForm((prev) => ({ ...prev, maxMonths: event.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

