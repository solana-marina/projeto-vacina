import React from 'react';
import { Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { ALL_ROLES, ROLE_LABELS } from '../../lib/constants';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { School, UserItem, UserRole } from '../../types/api';

const EMPTY_FORM = {
  email: '',
  full_name: '',
  role: 'ESCOLA' as UserRole,
  school: '',
  password: '',
  is_active: true,
};

export function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, schoolsData] = await Promise.all([api.listUsers(), api.listSchools()]);
      setUsers(usersData);
      setSchools(schoolsData);
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível carregar usuários.'));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setEditingId(user.id);
    setForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      school: user.school ? String(user.school) : '',
      password: '',
      is_active: user.is_active,
    });
    setIsModalOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        school: form.role === 'ESCOLA' ? (form.school ? Number(form.school) : null) : null,
        is_active: form.is_active,
      };

      if (editingId) {
        await api.updateUser(editingId, payload);
        toast.success('Usuário atualizado.');
      } else {
        if (!form.password) {
          toast.error('Informe a senha para criação do usuário.');
          return;
        }
        await api.createUser({ ...payload, password: form.password });
        toast.success('Usuário criado.');
      }
      setIsModalOpen(false);
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao salvar usuário.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">Usuários</h1>
          <p className="text-gray-500">Gerencie perfis e papéis de acesso.</p>
        </div>
        <Button data-testid="admin-user-open-create" className="w-full sm:w-auto" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </TableCell>
                <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                <TableCell>{schools.find((school) => school.id === user.school)?.name || '-'}</TableCell>
                <TableCell>
                  <Badge status={user.is_active ? 'ACTIVE' : 'INACTIVE'} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {loading ? <div className="p-6 text-center text-gray-500">Carregando...</div> : null}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar usuário' : 'Novo usuário'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="admin-user-save" onClick={() => void save()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input
            data-testid="admin-user-full-name"
            label="Nome completo"
            value={form.full_name}
            onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
          />
          <Input
            data-testid="admin-user-email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />

          {!editingId ? (
            <Input
              data-testid="admin-user-password"
              label="Senha"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select label="Papel" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>

            <Select
              label="Escola (obrigatória para papel escola)"
              value={form.school}
              disabled={form.role !== 'ESCOLA'}
              onChange={(event) => setForm((prev) => ({ ...prev, school: event.target.value }))}
            >
              <option value="">Sem vínculo</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Usuário ativo
          </label>
        </div>
      </Modal>
    </div>
  );
}
