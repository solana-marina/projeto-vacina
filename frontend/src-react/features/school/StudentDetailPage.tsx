import React from 'react';
import { ArrowLeft, Calendar, Edit, FileText, Plus, Trash2, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../../components/ui/core';
import { formatAgeMonths, formatAgeRangeMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { formatSex } from '../../lib/sex';
import { api } from '../../services/api';
import { ImmunizationStatus, Student, Vaccine, VaccinationRecord } from '../../types/api';

interface StudentDetailPageProps {
  adminMode?: boolean;
}

const EMPTY_RECORD = {
  id: 0,
  vaccine: 0,
  dose_number: 1,
  application_date: '',
  source: 'INFORMADO_ESCOLA' as 'INFORMADO_ESCOLA' | 'CONFIRMADO_SAUDE',
  notes: '',
};

export function StudentDetailPage({ adminMode = false }: StudentDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const studentId = Number(id);

  const [student, setStudent] = React.useState<Student | null>(null);
  const [status, setStatus] = React.useState<ImmunizationStatus | null>(null);
  const [records, setRecords] = React.useState<VaccinationRecord[]>([]);
  const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isFutureModalOpen, setIsFutureModalOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_RECORD);

  const listPath = adminMode ? '/admin/students' : '/school/students';

  const loadData = React.useCallback(async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    try {
      const [studentData, statusData, recordData, vaccineData] = await Promise.all([
        api.getStudent(studentId),
        api.getImmunizationStatus(studentId),
        api.listVaccinations(studentId),
        api.listVaccines(),
      ]);
      setStudent(studentData);
      setStatus(statusData);
      setRecords(recordData);
      setVaccines(vaccineData);
      setForm((prev) => ({ ...prev, vaccine: prev.vaccine || vaccineData[0]?.id || 0 }));
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível carregar o detalhe do estudante.'));
      navigate(listPath);
    } finally {
      setLoading(false);
    }
  }, [listPath, navigate, studentId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setForm({ ...EMPTY_RECORD, vaccine: vaccines[0]?.id ?? 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (record: VaccinationRecord) => {
    setForm({
      id: record.id,
      vaccine: record.vaccine,
      dose_number: record.dose_number,
      application_date: record.application_date,
      source: record.source,
      notes: record.notes || '',
    });
    setIsModalOpen(true);
  };

  const saveVaccination = async () => {
    if (!studentId) {
      return;
    }

    try {
      const payload = {
        vaccine: Number(form.vaccine),
        dose_number: Number(form.dose_number),
        application_date: form.application_date,
        source: form.source,
        notes: form.notes,
      };

      if (form.id) {
        await api.updateVaccination(form.id, payload);
        toast.success('Registro vacinal atualizado.');
      } else {
        await api.addVaccination(studentId, payload);
        toast.success('Registro vacinal adicionado.');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível salvar o registro vacinal.'));
    }
  };

  const deleteRecord = async (recordId: number) => {
    if (!window.confirm('Deseja remover este registro vacinal?')) {
      return;
    }

    try {
      await api.deleteVaccination(recordId);
      toast.success('Registro removido.');
      await loadData();
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível remover o registro.'));
    }
  };

  if (loading || !student || !status) {
    return <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(listPath)} className="flex items-center text-sm text-gray-500 hover:text-[#0B5D7A]">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para estudantes
      </button>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-poppins text-2xl font-bold text-gray-900">{student.full_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(student.birth_date).toLocaleDateString('pt-BR')}
                </span>
                <span>{formatAgeMonths(student.age_months)}</span>
                <span>{formatSex(student.sex)}</span>
                <span>{student.school_name}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Responsável: <span className="font-medium text-gray-900">{student.guardian_name || '-'}</span>
              </p>
            </div>
          </div>
          <Badge status={status.status} className="px-3 py-1 text-sm" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Situação vacinal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                Status atual: <span className="font-semibold">{status.status.replace('_', ' ')}</span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                Idade: <span className="font-semibold">{formatAgeMonths(status.ageMonths)}</span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                Calendário ativo: <span className="font-semibold">{status.activeScheduleCode || 'Não definido'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pendências</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsFutureModalOpen(true)} disabled={status.future.length === 0}>
                Vacinas futuras
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {status.pending.length === 0 ? (
                <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">Nenhuma pendência encontrada.</p>
              ) : (
                status.pending.map((pending, index) => (
                  <div key={`${pending.vaccineCode}-${pending.doseNumber}-${index}`} className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {pending.vaccineName} - Dose {pending.doseNumber}
                      </p>
                      <Badge status={pending.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Janela recomendada: {formatAgeRangeMonths(pending.recommendedMinAgeMonths, pending.recommendedMaxAgeMonths)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="inline-flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0B5D7A]" />
              Registros vacinais
            </CardTitle>
            <Button data-testid="vaccination-open-form" size="sm" onClick={openCreateModal}>
              <Plus className="mr-1 h-4 w-4" />
              Novo registro
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vacina</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.vaccine_name}</TableCell>
                    <TableCell>{record.dose_number}</TableCell>
                    <TableCell>{new Date(record.application_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs">
                        {record.source === 'CONFIRMADO_SAUDE' ? 'Confirmado pela saúde' : 'Informado pela escola'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(record)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void deleteRecord(record.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>

            {records.length === 0 ? <div className="p-6 text-center text-sm text-gray-500">Sem registros vacinais cadastrados.</div> : null}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={form.id ? 'Editar registro vacinal' : 'Adicionar registro vacinal'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="vaccination-save" onClick={() => void saveVaccination()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Select label="Vacina" value={form.vaccine} onChange={(event) => setForm((prev) => ({ ...prev, vaccine: Number(event.target.value) }))}>
            {vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>
                {vaccine.code} - {vaccine.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              data-testid="vaccination-dose"
              label="Dose"
              type="number"
              min={1}
              value={form.dose_number}
              onChange={(event) => setForm((prev) => ({ ...prev, dose_number: Number(event.target.value) }))}
            />
            <Input
              data-testid="vaccination-date"
              label="Data da aplicação"
              type="date"
              value={form.application_date}
              onChange={(event) => setForm((prev) => ({ ...prev, application_date: event.target.value }))}
            />
          </div>

          <Select
            label="Fonte"
            value={form.source}
            onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value as 'INFORMADO_ESCOLA' | 'CONFIRMADO_SAUDE' }))}
          >
            <option value="INFORMADO_ESCOLA">Informado pela escola</option>
            <option value="CONFIRMADO_SAUDE">Confirmado pela saúde</option>
          </Select>

          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Observações opcionais"
          />
        </div>
      </Modal>

      <Modal
        isOpen={isFutureModalOpen}
        onClose={() => setIsFutureModalOpen(false)}
        title="Vacinas futuras"
        footer={
          <Button variant="outline" onClick={() => setIsFutureModalOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="space-y-3">
          {status.future.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Não há vacinas futuras pendentes para este estudante.
            </p>
          ) : (
            status.future.map((futureItem, index) => (
              <div key={`${futureItem.vaccineCode}-${futureItem.doseNumber}-${index}`} className="rounded-lg border bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">
                  {futureItem.vaccineName} - Dose {futureItem.doseNumber}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Faixa recomendada: {formatAgeRangeMonths(futureItem.recommendedMinAgeMonths, futureItem.recommendedMaxAgeMonths)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Prevista para daqui a aproximadamente {formatAgeMonths(futureItem.monthsUntilDue)}.
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
