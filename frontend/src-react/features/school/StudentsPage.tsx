import React from 'react';
import { AlertCircle, CheckCircle, Clock, Filter, Pencil, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { useAuth } from '../../context/AuthContext';
import { formatAgeMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { formatSex } from '../../lib/sex';
import { api } from '../../services/api';
import { School, Student } from '../../types/api';

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
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sexFilter, setSexFilter] = React.useState('');
  const [schoolFilter, setSchoolFilter] = React.useState<string>('');

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

  const loadStudents = React.useCallback(
    async (requestedPage = page) => {
      setLoading(true);
      try {
        const response = await api.listStudents({
          page: requestedPage,
          q: query || undefined,
          status: status || undefined,
          schoolId: effectiveSchoolId,
          sex: (sexFilter || undefined) as 'F' | 'M' | 'NI' | undefined,
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
    [effectiveSchoolId, page, query, sexFilter, status],
  );

  React.useEffect(() => {
    void loadStudents(1);
  }, [loadStudents]);

  React.useEffect(() => {
    if (!adminMode) {
      return;
    }
    void (async () => {
      try {
        setSchools(await api.listSchools());
      } catch (error) {
        toast.error(parseApiError(error, 'Não foi possível carregar escolas.'));
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
        <Button data-testid="student-form-open" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Novo estudante
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total na página" value={String(students.length)} icon={Users} color="#0B5D7A" />
        <StatCard title="Em dia" value={String(emDia)} icon={CheckCircle} color="#2A9D8F" />
        <StatCard title="Atrasado" value={String(atrasado)} icon={AlertCircle} color="#E76F51" />
        <StatCard title="Sem dados" value={String(semDados)} icon={Clock} color="#F4A261" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              data-testid="students-filter-name"
              placeholder="Buscar por nome"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="EM_DIA">Em dia</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="INCOMPLETO">Incompleto</option>
            <option value="SEM_DADOS">Sem dados</option>
          </Select>
          <Select value={sexFilter} onChange={(event) => setSexFilter(event.target.value)}>
            <option value="">Todos os sexos</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="NI">Não informado</option>
          </Select>
          {adminMode ? (
            <Select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
              <option value="">Todas as escolas</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          ) : (
            <Button data-testid="students-filter-submit" className="gap-2" onClick={() => void loadStudents(1)}>
              <Filter className="h-4 w-4" />
              Aplicar
            </Button>
          )}
        </div>
        {adminMode ? (
          <div className="mt-3 flex justify-end">
            <Button data-testid="students-filter-submit" className="gap-2" onClick={() => void loadStudents(1)}>
              <Filter className="h-4 w-4" />
              Aplicar
            </Button>
          </div>
        ) : null}
      </div>

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

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-sm text-gray-500">Total: {total} estudantes</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => void loadStudents(page - 1)}>
            Anterior
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">Página {page}</span>
          <Button variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => void loadStudents(page + 1)}>
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
