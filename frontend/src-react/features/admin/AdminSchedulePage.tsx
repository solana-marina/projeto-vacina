import React from 'react';
import { Check, CircleHelp, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { formatAgeMonths, formatAgeRangeMonths, monthInputIsValid, monthsFromYearsMonths, splitMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { Schedule, ScheduleRule, Vaccine } from '../../types/api';

const EMPTY_SCHEDULE = {
  code: '',
  name: '',
  is_active: false,
};

const EMPTY_RULE = {
  vaccine: 0,
  dose_number: 1,
  minYears: '0',
  minMonths: '0',
  maxYears: '0',
  maxMonths: '0',
};

const EMPTY_VACCINE = {
  code: '',
  name: '',
};

export function AdminSchedulePage() {
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<number | null>(null);
  const [rules, setRules] = React.useState<ScheduleRule[]>([]);
  const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = React.useState(false);
  const [isVaccineModalOpen, setIsVaccineModalOpen] = React.useState(false);

  const [scheduleForm, setScheduleForm] = React.useState(EMPTY_SCHEDULE);
  const [ruleForm, setRuleForm] = React.useState(EMPTY_RULE);
  const [vaccineForm, setVaccineForm] = React.useState(EMPTY_VACCINE);

  const [editingRuleId, setEditingRuleId] = React.useState<number | null>(null);
  const [editingVaccineId, setEditingVaccineId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [scheduleItems, vaccineItems] = await Promise.all([api.listSchedules(), api.listVaccines()]);
      setSchedules(scheduleItems);
      setVaccines(vaccineItems);

      const active = scheduleItems.find((item) => item.is_active);
      const selectedId = selectedScheduleId ?? active?.id ?? scheduleItems[0]?.id ?? null;
      setSelectedScheduleId(selectedId);

      if (selectedId) {
        const rulesData = await api.listRules(selectedId);
        setRules(rulesData);
      } else {
        setRules([]);
      }

      setRuleForm((prev) => ({ ...prev, vaccine: prev.vaccine || vaccineItems[0]?.id || 0 }));
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao carregar calendário vacinal.'));
    }
  }, [selectedScheduleId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openScheduleModal = () => {
    setScheduleForm(EMPTY_SCHEDULE);
    setIsScheduleModalOpen(true);
  };

  const saveSchedule = async () => {
    try {
      await api.createSchedule(scheduleForm);
      toast.success('Versão de calendário criada.');
      setIsScheduleModalOpen(false);
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao salvar versão de calendário.'));
    }
  };

  const activateSchedule = async (schedule: Schedule) => {
    const activeCount = schedules.filter((item) => item.is_active).length;

    if (schedule.is_active && activeCount === 1) {
      toast.info('Este é o único calendário ativo. Para trocar, ative outra versão.');
      return;
    }

    if (schedule.is_active) {
      toast.info('A versão selecionada já está ativa.');
      return;
    }

    try {
      await api.updateSchedule(schedule.id, { is_active: true });
      toast.success('Versão ativada.');
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível ativar a versão.'));
    }
  };

  const openCreateRuleModal = () => {
    if (!selectedScheduleId) {
      toast.error('Selecione uma versão de calendário primeiro.');
      return;
    }
    if (vaccines.length === 0) {
      toast.error('Cadastre ao menos uma vacina para criar regras.');
      return;
    }

    setEditingRuleId(null);
    setRuleForm({ ...EMPTY_RULE, vaccine: vaccines[0].id });
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule: ScheduleRule) => {
    const min = splitMonths(rule.recommended_min_age_months);
    const max = splitMonths(rule.recommended_max_age_months);

    setEditingRuleId(rule.id);
    setRuleForm({
      vaccine: rule.vaccine,
      dose_number: rule.dose_number,
      minYears: String(min.years),
      minMonths: String(min.months),
      maxYears: String(max.years),
      maxMonths: String(max.months),
    });
    setIsRuleModalOpen(true);
  };

  const saveRule = async () => {
    if (!selectedScheduleId) {
      return;
    }

    if (!monthInputIsValid(ruleForm.minMonths) || !monthInputIsValid(ruleForm.maxMonths)) {
      toast.error('Meses devem ficar entre 0 e 11.');
      return;
    }

    const minAge = monthsFromYearsMonths(ruleForm.minYears, ruleForm.minMonths);
    const maxAge = monthsFromYearsMonths(ruleForm.maxYears, ruleForm.maxMonths);
    if (minAge === undefined || maxAge === undefined) {
      toast.error('Preencha idade mínima e máxima corretamente.');
      return;
    }

    const payload = {
      vaccine: ruleForm.vaccine,
      dose_number: ruleForm.dose_number,
      recommended_min_age_months: minAge,
      recommended_max_age_months: maxAge,
    };

    try {
      if (editingRuleId) {
        await api.updateRule(selectedScheduleId, editingRuleId, payload);
        toast.success('Regra atualizada.');
      } else {
        await api.createRule(selectedScheduleId, payload);
        toast.success('Regra criada.');
      }
      setIsRuleModalOpen(false);
      const rulesData = await api.listRules(selectedScheduleId);
      setRules(rulesData);
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao salvar regra.'));
    }
  };

  const deleteRule = async (rule: ScheduleRule) => {
    if (!selectedScheduleId) {
      return;
    }

    if (!window.confirm(`Excluir regra ${rule.vaccine_name} - dose ${rule.dose_number}?`)) {
      return;
    }

    try {
      await api.deleteRule(selectedScheduleId, rule.id);
      toast.success('Regra excluída.');
      const rulesData = await api.listRules(selectedScheduleId);
      setRules(rulesData);
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível excluir regra.'));
    }
  };

  const openCreateVaccineModal = () => {
    setEditingVaccineId(null);
    setVaccineForm(EMPTY_VACCINE);
    setIsVaccineModalOpen(true);
  };

  const openEditVaccineModal = (vaccine: Vaccine) => {
    setEditingVaccineId(vaccine.id);
    setVaccineForm({ code: vaccine.code, name: vaccine.name });
    setIsVaccineModalOpen(true);
  };

  const saveVaccine = async () => {
    try {
      if (editingVaccineId) {
        await api.updateVaccine(editingVaccineId, vaccineForm);
        toast.success('Vacina atualizada.');
      } else {
        await api.createVaccine(vaccineForm);
        toast.success('Vacina criada.');
      }
      setIsVaccineModalOpen(false);
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao salvar vacina.'));
    }
  };

  const deleteVaccine = async (vaccine: Vaccine) => {
    if (!window.confirm(`Excluir vacina ${vaccine.code} - ${vaccine.name}?`)) {
      return;
    }

    try {
      await api.deleteVaccine(vaccine.id);
      toast.success('Vacina excluída.');
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível excluir vacina vinculada a regra/registro.'));
    }
  };

  const onScheduleChange = async (value: string) => {
    const scheduleId = Number(value);
    setSelectedScheduleId(scheduleId);
    try {
      const rulesData = await api.listRules(scheduleId);
      setRules(rulesData);
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao carregar regras da versão selecionada.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">Calendário vacinal</h1>
          <p className="text-gray-500">Gerencie versões, vacinas e regras por dose/faixa etária.</p>
        </div>
        <Button data-testid="admin-schedule-open-create" onClick={openScheduleModal}>
          <Plus className="mr-2 h-4 w-4" />
          Nova versão
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vacinas cadastradas</CardTitle>
            <Button data-testid="admin-vaccine-open-create" size="sm" variant="outline" onClick={openCreateVaccineModal}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar nova vacina
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Vacina</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {vaccines.map((vaccine) => (
                  <TableRow key={vaccine.id}>
                    <TableCell className="font-mono text-xs">{vaccine.code}</TableCell>
                    <TableCell>{vaccine.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditVaccineModal(vaccine)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void deleteVaccine(vaccine)}>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Versões de calendário</CardTitle>
              <div className="group relative">
                <CircleHelp className="h-4 w-4 text-gray-400" />
                <div className="absolute left-6 top-0 z-20 hidden w-72 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg group-hover:block">
                  Sempre deve existir 1 calendário ativo. Para trocar, ative outra versão. O calendário ativo vigente não pode ficar sem substituto.
                </div>
              </div>
            </div>
            <Badge status={schedules.some((item) => item.is_active) ? 'ACTIVE' : 'INACTIVE'} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-mono text-xs">{schedule.code}</TableCell>
                    <TableCell>{schedule.name}</TableCell>
                    <TableCell>
                      <Badge status={schedule.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => void activateSchedule(schedule)}>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Ativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Regras da versão selecionada</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedScheduleId ?? ''} onChange={(event) => void onScheduleChange(event.target.value)}>
              <option value="" disabled>
                Selecione uma versão
              </option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.code} - {schedule.name}
                </option>
              ))}
            </Select>
            <Button data-testid="admin-rule-open-create" onClick={openCreateRuleModal}>
              <Plus className="mr-2 h-4 w-4" />
              Nova regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vacina</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Idade mínima</TableHead>
                <TableHead>Idade máxima</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.vaccine_name}</TableCell>
                  <TableCell>{rule.dose_number}</TableCell>
                  <TableCell>{formatAgeMonths(rule.recommended_min_age_months)}</TableCell>
                  <TableCell>{formatAgeMonths(rule.recommended_max_age_months)}</TableCell>
                  <TableCell>{formatAgeRangeMonths(rule.recommended_min_age_months, rule.recommended_max_age_months)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditRuleModal(rule)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void deleteRule(rule)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
          {rules.length === 0 ? <div className="pt-4 text-center text-sm text-gray-500">Sem regras cadastradas para esta versão.</div> : null}
        </CardContent>
      </Card>

      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Nova versão de calendário"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="admin-schedule-save" onClick={() => void saveSchedule()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input
            data-testid="admin-schedule-code"
            label="Código"
            value={scheduleForm.code}
            onChange={(event) => setScheduleForm((prev) => ({ ...prev, code: event.target.value }))}
          />
          <Input
            data-testid="admin-schedule-name"
            label="Nome"
            value={scheduleForm.name}
            onChange={(event) => setScheduleForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={scheduleForm.is_active}
              onChange={(event) => setScheduleForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Definir como ativa
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title={editingRuleId ? 'Editar regra' : 'Nova regra'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRuleModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="admin-rule-save" onClick={() => void saveRule()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Select value={ruleForm.vaccine} onChange={(event) => setRuleForm((prev) => ({ ...prev, vaccine: Number(event.target.value) }))}>
            {vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>
                {vaccine.code} - {vaccine.name}
              </option>
            ))}
          </Select>
          <Input
            data-testid="admin-rule-dose-number"
            label="Número da dose"
            type="number"
            min={1}
            value={ruleForm.dose_number}
            onChange={(event) => setRuleForm((prev) => ({ ...prev, dose_number: Number(event.target.value) }))}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              data-testid="admin-rule-min-years"
              label="Idade mínima (anos)"
              type="number"
              min={0}
              value={ruleForm.minYears}
              onChange={(event) => setRuleForm((prev) => ({ ...prev, minYears: event.target.value }))}
            />
            <Input
              data-testid="admin-rule-min-months"
              label="Idade mínima (meses)"
              type="number"
              min={0}
              max={11}
              value={ruleForm.minMonths}
              onChange={(event) => setRuleForm((prev) => ({ ...prev, minMonths: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              data-testid="admin-rule-max-years"
              label="Idade máxima (anos)"
              type="number"
              min={0}
              value={ruleForm.maxYears}
              onChange={(event) => setRuleForm((prev) => ({ ...prev, maxYears: event.target.value }))}
            />
            <Input
              data-testid="admin-rule-max-months"
              label="Idade máxima (meses)"
              type="number"
              min={0}
              max={11}
              value={ruleForm.maxMonths}
              onChange={(event) => setRuleForm((prev) => ({ ...prev, maxMonths: event.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        title={editingVaccineId ? 'Editar vacina' : 'Adicionar vacina'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsVaccineModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="admin-vaccine-save" onClick={() => void saveVaccine()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input
            data-testid="admin-vaccine-code"
            label="Código"
            value={vaccineForm.code}
            onChange={(event) => setVaccineForm((prev) => ({ ...prev, code: event.target.value }))}
          />
          <Input
            data-testid="admin-vaccine-name"
            label="Nome"
            value={vaccineForm.name}
            onChange={(event) => setVaccineForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
