import React from 'react';
import { Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Badge, Button, Card, Input, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { School } from '../../types/api';

const EMPTY_FORM = {
  name: '',
  inep_code: '',
  territory_ref: '',
  address: '',
};

export function AdminSchoolsPage() {
  const [schools, setSchools] = React.useState<School[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setSchools(await api.listSchools());
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível carregar escolas.'));
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

  const openEdit = (school: School) => {
    setEditingId(school.id);
    setForm({
      name: school.name || '',
      inep_code: school.inep_code || '',
      territory_ref: school.territory_ref || '',
      address: school.address || '',
    });
    setIsModalOpen(true);
  };

  const save = async () => {
    try {
      if (editingId) {
        await api.updateSchool(editingId, form);
        toast.success('Escola atualizada.');
      } else {
        await api.createSchool(form);
        toast.success('Escola criada.');
      }
      setIsModalOpen(false);
      await load();
    } catch (error) {
      toast.error(parseApiError(error, 'Falha ao salvar escola.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">Gestão de escolas</h1>
          <p className="text-gray-500">Cadastre e mantenha as unidades escolares.</p>
        </div>
        <Button data-testid="admin-school-open-create" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova escola
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>INEP</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Território</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-mono text-xs">{school.inep_code || '-'}</TableCell>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{school.territory_ref || '-'}</TableCell>
                <TableCell>
                  <Badge status="ACTIVE" />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openEdit(school)}>
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
        title={editingId ? 'Editar escola' : 'Nova escola'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="admin-school-save" onClick={() => void save()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input
            data-testid="admin-school-name"
            label="Nome"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Código INEP"
              value={form.inep_code}
              onChange={(event) => setForm((prev) => ({ ...prev, inep_code: event.target.value }))}
            />
            <Input
              label="Território"
              value={form.territory_ref}
              onChange={(event) => setForm((prev) => ({ ...prev, territory_ref: event.target.value }))}
            />
          </div>
          <Input
            label="Endereço"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
