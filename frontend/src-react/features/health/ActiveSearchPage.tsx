import React from 'react';
import { Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge, Button, Card, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { formatAgeMonths, monthInputIsValid, monthsFromYearsMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { formatSex } from '../../lib/sex';
import { api } from '../../services/api';
import { School, Student } from '../../types/api';

export function ActiveSearchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);

  const [q, setQ] = React.useState('');
  const [schoolId, setSchoolId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sex, setSex] = React.useState('');
  const [ageMinYears, setAgeMinYears] = React.useState('');
  const [ageMinMonths, setAgeMinMonths] = React.useState('');
  const [ageMaxYears, setAgeMaxYears] = React.useState('');
  const [ageMaxMonths, setAgeMaxMonths] = React.useState('');
  const [anonymizedExport, setAnonymizedExport] = React.useState(false);

  const search = React.useCallback(async () => {
    if (!monthInputIsValid(ageMinMonths) || !monthInputIsValid(ageMaxMonths)) {
      toast.error('Meses devem ficar entre 0 e 11.');
      return;
    }

    setLoading(true);
    try {
      const ageMin = monthsFromYearsMonths(ageMinYears, ageMinMonths);
      const ageMax = monthsFromYearsMonths(ageMaxYears, ageMaxMonths);
      if ((ageMinYears || ageMinMonths) && ageMin === undefined) {
        toast.error('Idade mínima inválida.');
        return;
      }
      if ((ageMaxYears || ageMaxMonths) && ageMax === undefined) {
        toast.error('Idade máxima inválida.');
        return;
      }

      const response = await api.listStudents({
        page: 1,
        q: q || undefined,
        schoolId: schoolId ? Number(schoolId) : undefined,
        status: status || undefined,
        sex: (sex || undefined) as 'F' | 'M' | 'NI' | undefined,
        ageMin,
        ageMax,
      });
      setStudents(response.results);
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao buscar estudantes.'));
    } finally {
      setLoading(false);
    }
  }, [ageMaxMonths, ageMaxYears, ageMinMonths, ageMinYears, q, schoolId, sex, status]);

  React.useEffect(() => {
    void (async () => {
      try {
        const schoolItems = await api.listSchools();
        setSchools(schoolItems);
      } catch (error) {
        toast.error(parseApiError(error, 'Não foi possível carregar escolas.'));
      }
    })();
    void search();
  }, [search]);

  const exportCsv = async () => {
    if (!monthInputIsValid(ageMinMonths) || !monthInputIsValid(ageMaxMonths)) {
      toast.error('Meses devem ficar entre 0 e 11.');
      return;
    }

    try {
      const ageMin = monthsFromYearsMonths(ageMinYears, ageMinMonths);
      const ageMax = monthsFromYearsMonths(ageMaxYears, ageMaxMonths);
      const blob = await api.exportPendingCsv(
        {
          q: q || undefined,
          schoolId: schoolId ? Number(schoolId) : undefined,
          status: status || undefined,
          sex: (sex || undefined) as 'F' | 'M' | 'NI' | undefined,
          ageMin,
          ageMax,
        },
        anonymizedExport,
      );
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = anonymizedExport ? 'students_pending_anonymized.csv' : 'students_pending.csv';
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exportação CSV iniciada.');
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao exportar CSV.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">Busca ativa nominal</h1>
          <p className="text-gray-500">Filtre por escola, status, sexo e faixa etária para apoiar a equipe de saúde.</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="health-open-dashboards" variant="outline" onClick={() => navigate('/health/dashboards')}>
            Ir para dashboards
          </Button>
          <Button data-testid="health-export-csv" variant="secondary" onClick={() => void exportCsv()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              data-testid="health-search-name"
              label="Nome"
              placeholder="Buscar estudante"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <Select label="Escola" value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>
            <option value="">Todas</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </Select>
          <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="EM_DIA">Em dia</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="INCOMPLETO">Incompleto</option>
            <option value="SEM_DADOS">Sem dados</option>
          </Select>
          <Select label="Sexo" value={sex} onChange={(event) => setSex(event.target.value)}>
            <option value="">Todos</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="NI">Não informado</option>
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Input label="Idade mínima (anos)" type="number" min={0} value={ageMinYears} onChange={(event) => setAgeMinYears(event.target.value)} />
          <Input
            label="Idade mínima (meses)"
            type="number"
            min={0}
            max={11}
            value={ageMinMonths}
            onChange={(event) => setAgeMinMonths(event.target.value)}
          />
          <Input label="Idade máxima (anos)" type="number" min={0} value={ageMaxYears} onChange={(event) => setAgeMaxYears(event.target.value)} />
          <Input
            label="Idade máxima (meses)"
            type="number"
            min={0}
            max={11}
            value={ageMaxMonths}
            onChange={(event) => setAgeMaxMonths(event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={anonymizedExport} onChange={(event) => setAnonymizedExport(event.target.checked)} />
            Exportação anonimizada (nome por iniciais)
          </label>
          <Button data-testid="health-search-submit" onClick={() => void search()}>
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell>{formatSex(student.sex)}</TableCell>
                <TableCell>{student.school_name}</TableCell>
                <TableCell>{formatAgeMonths(student.age_months)}</TableCell>
                <TableCell>
                  <Badge status={student.current_status} />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {loading ? <div className="p-6 text-center text-gray-500">Carregando...</div> : null}
        {!loading && students.length === 0 ? <div className="p-6 text-center text-gray-500">Nenhum resultado encontrado.</div> : null}
      </Card>
    </div>
  );
}
