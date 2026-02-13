import React from 'react';
import { Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { StudentFilterValues, StudentFiltersPanel } from '../../components/filters/StudentFiltersPanel';
import { Badge, Button, Card, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { formatAgeMonths, monthInputIsValid, monthsFromYearsMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { formatSex } from '../../lib/sex';
import { api } from '../../services/api';
import { School, Student, Vaccine } from '../../types/api';

export function ActiveSearchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);
  const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);

  const [q, setQ] = React.useState('');
  const [schoolId, setSchoolId] = React.useState('');
  const [vaccineId, setVaccineId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sex, setSex] = React.useState('');
  const [ageMinYears, setAgeMinYears] = React.useState('');
  const [ageMinMonths, setAgeMinMonths] = React.useState('');
  const [ageMaxYears, setAgeMaxYears] = React.useState('');
  const [ageMaxMonths, setAgeMaxMonths] = React.useState('');

  const filters: StudentFilterValues = {
    q,
    schoolId,
    vaccineId,
    status,
    sex,
    ageMinYears,
    ageMinMonths,
    ageMaxYears,
    ageMaxMonths,
  };

  const setFilter = (field: keyof StudentFilterValues, value: string) => {
    const map: Record<keyof StudentFilterValues, React.Dispatch<React.SetStateAction<string>>> = {
      q: setQ,
      schoolId: setSchoolId,
      vaccineId: setVaccineId,
      status: setStatus,
      sex: setSex,
      ageMinYears: setAgeMinYears,
      ageMinMonths: setAgeMinMonths,
      ageMaxYears: setAgeMaxYears,
      ageMaxMonths: setAgeMaxMonths,
    };
    map[field](value);
  };
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
        vaccineId: vaccineId ? Number(vaccineId) : undefined,
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
  }, [ageMaxMonths, ageMaxYears, ageMinMonths, ageMinYears, q, schoolId, sex, status, vaccineId]);

  React.useEffect(() => {
    void (async () => {
      try {
        const [schoolItems, vaccineItems] = await Promise.all([api.listSchools(), api.listVaccines()]);
        setSchools(schoolItems);
        setVaccines(vaccineItems);
      } catch (error) {
        toast.error(parseApiError(error, 'Não foi possível carregar filtros da busca ativa.'));
      }
    })();
    void search();
  }, [search]);

  const exportCsv = async (anonymized = false) => {
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
          vaccineId: vaccineId ? Number(vaccineId) : undefined,
          status: status || undefined,
          sex: (sex || undefined) as 'F' | 'M' | 'NI' | undefined,
          ageMin,
          ageMax,
        },
        anonymized,
      );
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = anonymized ? 'students_pending_anonymized.csv' : 'students_pending.csv';
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
          <p className="text-gray-500">Filtre por escola, vacina, status, sexo e faixa etária para apoiar a equipe de saúde.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button
            data-testid="health-open-dashboards"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate('/health/dashboards')}
          >
            Ir para dashboards
          </Button>
          <Button data-testid="health-export-csv" variant="outline" className="w-full sm:w-auto" onClick={() => void exportCsv(false)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar relatório
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => void exportCsv(true)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar anonimizado
          </Button>
        </div>
      </div>

      <StudentFiltersPanel
        values={filters}
        onChange={setFilter}
        onApply={() => void search()}
        schools={schools}
        vaccines={vaccines}
        showSchoolFilter
        applyButtonLabel="Buscar"
        applyButtonTestId="health-search-submit"
        applyButtonIcon={<Search className="mr-2 h-4 w-4" />}
      />

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
