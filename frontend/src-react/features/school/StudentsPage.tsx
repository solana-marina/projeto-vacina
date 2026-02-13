import React from 'react';
import { AlertCircle, CheckCircle, Clock, Filter, Pencil, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { StudentFilterValues, StudentFiltersPanel } from '../../components/filters/StudentFiltersPanel';
import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { useAuth } from '../../context/AuthContext';
import { formatAgeMonths, monthsFromYearsMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { formatSex } from '../../lib/sex';
import { api } from '../../services/api';
import { School, Student, Vaccine } from '../../types/api';

const PAGE_SIZE = 10;

interface StudentsPageProps {
  adminMode?: boolean;
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="flex items-center gap-4 border-l-4 p-4" style={{ borderLeftColor: color }}>
      <div className="rounded-full p-3" style={{ backgroundColor: `${color}20` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
      </div>
    </Card>
  );
}

export function StudentsPage({ adminMode = false }: StudentsPageProps) {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);
  const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const [query, setQuery] = React.useState('');
  const [vaccineId, setVaccineId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sexFilter, setSexFilter] = React.useState('');
  const [schoolFilter, setSchoolFilter] = React.useState<string>('');
  const [ageMinYears, setAgeMinYears] = React.useState('');
  const [ageMinMonths, setAgeMinMonths] = React.useState('');
  const [ageMaxYears, setAgeMaxYears] = React.useState('');
  const [ageMaxMonths, setAgeMaxMonths] = React.useState('');

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Student | null>(null);
  const [form, setForm] = React.useState({
    school: '',
    full_name: '',
    birth_date: '',
    sex: 'F' as 'F' | 'M' | 'NI',
    guardian_name: '',
    guardian_contact: '',
  });

  const effectiveSchoolId = adminMode ? (schoolFilter ? Number(schoolFilter) : undefined) : session?.schoolId ?? undefined;
  const filters: StudentFilterValues = {
    q: query,
    schoolId: schoolFilter,
    vaccineId,
    status,
    sex: sexFilter,
    ageMinYears,
    ageMinMonths,
    ageMaxYears,
    ageMaxMonths,
  };

  const setFilter = (field: keyof StudentFilterValues, value: string) => {
    const map: Record<keyof StudentFilterValues, React.Dispatch<React.SetStateAction<string>>> = {
      q: setQuery,
      schoolId: setSchoolFilter,
      vaccineId: setVaccineId,
      status: setStatus,
      sex: setSexFilter,
      ageMinYears: setAgeMinYears,
      ageMinMonths: setAgeMinMonths,
      ageMaxYears: setAgeMaxYears,
      ageMaxMonths: setAgeMaxMonths,
    };
    map[field](value);
  };

  const loadStudents = React.useCallback(
    async (requestedPage = 1) => {
      setLoading(true);
      try {
        const ageMin = monthsFromYearsMonths(ageMinYears, ageMinMonths);
        const ageMax = monthsFromYearsMonths(ageMaxYears, ageMaxMonths);

        const response = await api.listStudents({
          page: requestedPage,
          q: query || undefined,
          vaccineId: vaccineId ? Number(vaccineId) : undefined,
          status: status || undefined,
          schoolId: effectiveSchoolId,
          sex: (sexFilter || undefined) as 'F' | 'M' | 'NI' | undefined,
          ageMin,
          ageMax,
        });
        setStudents(response.results);
        setTotal(response.count);
        setPage(requestedPage);
      } catch (error) {
        toast.error(parseApiError(error, 'Não foi possível carregar estudantes.'));
      } finally {
        setLoading(false);
      }
    },
    [ageMaxMonths, ageMaxYears, ageMinMonths, ageMinYears, effectiveSchoolId, query, sexFilter, status, vaccineId],
  );

  React.useEffect(() => {
    void loadStudents(1);
  }, [loadStudents]);

  React.useEffect(() => {
    void (async () => {
      try {
        const vaccineItemsPromise = api.listVaccines();
        if (adminMode) {
          const [schoolItems, vaccineItems] = await Promise.all([api.listSchools(), vaccineItemsPromise]);
          setSchools(schoolItems);
          setVaccines(vaccineItems);
          return;
        }
        setVaccines(await vaccineItemsPromise);
      } catch (error) {
        toast.error(parseApiError(error, 'Nao foi possivel carregar filtros.'));
      }
    })();
  }, [adminMode]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      school: adminMode ? schoolFilter : String(session?.schoolId || ''),
      full_name: '',
      birth_date: '',
      sex: 'F',
      guardian_name: '',
      guardian_contact: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditing(student);
    setForm({
      school: String(student.school),
      full_name: student.full_name,
      birth_date: student.birth_date,
      sex: student.sex,
      guardian_name: student.guardian_name || '',
      guardian_contact: student.guardian_contact || '',
    });
    setIsModalOpen(true);
  };

  const saveStudent = async () => {
    const selectedSchoolId = Number(form.school || session?.schoolId || 0);
    if (!selectedSchoolId) {
      toast.error('Selecione a escola do estudante.');
      return;
    }

    const payload = {
      school: selectedSchoolId,
      full_name: form.full_name,
      birth_date: form.birth_date,
      sex: form.sex,
      guardian_name: form.guardian_name,
      guardian_contact: form.guardian_contact,
    };

    try {
      if (editing) {
        await api.updateStudent(editing.id, payload);
        toast.success('Estudante atualizado com sucesso.');
      } else {
        await api.createStudent(payload);
        toast.success('Estudante criado com sucesso.');
      }
      setIsModalOpen(false);
      await loadStudents(1);
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível salvar o estudante.'));
    }
  };

  const emDia = students.filter((student) => student.current_status === 'EM_DIA').length;
  const atrasado = students.filter((student) => student.current_status === 'ATRASADO').length;
  const semDados = students.filter((student) => student.current_status === 'SEM_DADOS').length;

  const basePath = adminMode ? '/admin/students' : '/school/students';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-gray-900">Estudantes</h1>
          <p className="text-gray-500">
            {adminMode
              ? 'Visão consolidada de estudantes da rede com filtros avançados.'
              : 'Gerencie a situação vacinal dos estudantes da escola.'}
          </p>
        </div>
        <Button data-testid="student-form-open" className="w-full sm:w-auto" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Novo estudante
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de estudantes" value={String(total)} icon={Users} color="#0B5D7A" />
        <StatCard title="Em dia" value={String(emDia)} icon={CheckCircle} color="#2A9D8F" />
        <StatCard title="Atrasado" value={String(atrasado)} icon={AlertCircle} color="#E76F51" />
        <StatCard title="Sem dados" value={String(semDados)} icon={Clock} color="#F4A261" />
      </div>

      <StudentFiltersPanel
        values={filters}
        onChange={setFilter}
        onApply={() => void loadStudents(1)}
        schools={schools}
        vaccines={vaccines}
        showSchoolFilter={adminMode}
        applyButtonTestId="students-filter-submit"
        applyButtonLabel="Aplicar"
        applyButtonIcon={<Filter className="mr-2 h-4 w-4" />}
        namePlaceholder="Buscar por nome"
      />

      <Card className="overflow-hidden border-0 shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="font-medium text-gray-900">{student.full_name}</div>
                  <div className="text-xs text-gray-500">Nascimento: {new Date(student.birth_date).toLocaleDateString('pt-BR')}</div>
                </TableCell>
                <TableCell>{formatSex(student.sex)}</TableCell>
                <TableCell>{student.school_name}</TableCell>
                <TableCell>{formatAgeMonths(student.age_months)}</TableCell>
                <TableCell>
                  <Badge status={student.current_status} />
                </TableCell>
                <TableCell>{student.guardian_name || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(student)}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/${student.id}`)}>
                      Detalhe
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>

        {loading ? <div className="p-8 text-center text-gray-500">Carregando...</div> : null}
        {!loading && students.length === 0 ? <div className="p-8 text-center text-gray-500">Nenhum estudante encontrado.</div> : null}
      </Card>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">Total: {total} estudantes</p>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <Button variant="outline" className="flex-1 sm:flex-none" disabled={page <= 1} onClick={() => void loadStudents(page - 1)}>
            Anterior
          </Button>
          <span className="flex flex-1 items-center justify-center px-3 text-sm text-gray-600 sm:flex-none">Página {page}</span>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled={page * PAGE_SIZE >= total}
            onClick={() => void loadStudents(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar estudante' : 'Cadastrar estudante'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="student-form-save" onClick={() => void saveStudent()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {adminMode ? (
            <Select label="Escola" value={form.school} onChange={(event) => setForm((prev) => ({ ...prev, school: event.target.value }))}>
              <option value="">Selecione</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          ) : null}

          <Input
            data-testid="student-form-name"
            label="Nome completo"
            value={form.full_name}
            onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              data-testid="student-form-birth-date"
              label="Data de nascimento"
              type="date"
              value={form.birth_date}
              onChange={(event) => setForm((prev) => ({ ...prev, birth_date: event.target.value }))}
            />
            <Select
              label="Sexo"
              value={form.sex}
              onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value as 'F' | 'M' | 'NI' }))}
            >
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </Select>
          </div>

          <Input
            label="Responsável"
            value={form.guardian_name}
            onChange={(event) => setForm((prev) => ({ ...prev, guardian_name: event.target.value }))}
          />
          <Input
            label="Contato do responsável"
            value={form.guardian_contact}
            onChange={(event) => setForm((prev) => ({ ...prev, guardian_contact: event.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
