import React from 'react';
import { AlertTriangle, ClipboardList, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../../components/ui/modal';
import { Button, Card, Input, Select, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { AuditLogItem, ErrorLogItem } from '../../types/api';

type Tab = 'audit' | 'error';

interface Filters {
  q: string;
  action: string;
  entityType: string;
  actorId: string;
  statusCode: string;
  path: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  q: '',
  action: '',
  entityType: '',
  actorId: '',
  statusCode: '',
  path: '',
  dateFrom: '',
  dateTo: '',
};

export function AdminMonitoringPage() {
  const [tab, setTab] = React.useState<Tab>('audit');
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);

  const [loading, setLoading] = React.useState(false);
  const [auditItems, setAuditItems] = React.useState<AuditLogItem[]>([]);
  const [errorItems, setErrorItems] = React.useState<ErrorLogItem[]>([]);
  const [count, setCount] = React.useState(0);

  const [selectedItem, setSelectedItem] = React.useState<AuditLogItem | ErrorLogItem | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'audit') {
        const response = await api.listAuditLogs({
          q: appliedFilters.q || undefined,
          action: appliedFilters.action || undefined,
          entityType: appliedFilters.entityType || undefined,
          actorId: appliedFilters.actorId || undefined,
          dateFrom: appliedFilters.dateFrom || undefined,
          dateTo: appliedFilters.dateTo || undefined,
          page,
        });
        setAuditItems(response.results);
        setCount(response.count);
      } else {
        const response = await api.listErrorLogs({
          q: appliedFilters.q || undefined,
          statusCode: appliedFilters.statusCode || undefined,
          path: appliedFilters.path || undefined,
          dateFrom: appliedFilters.dateFrom || undefined,
          dateTo: appliedFilters.dateTo || undefined,
          page,
        });
        setErrorItems(response.results);
        setCount(response.count);
      }
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível carregar monitoramento.'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, tab]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const pageSize = 10;
  const canGoNext = page * pageSize < count;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">Auditoria e logs</h1>
          <p className="text-gray-500">Rastreabilidade das ações críticas e erros operacionais do sistema.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button variant={tab === 'audit' ? 'primary' : 'outline'} onClick={() => { setTab('audit'); setPage(1); }}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Auditoria
          </Button>
          <Button variant={tab === 'error' ? 'primary' : 'outline'} onClick={() => { setTab('error'); setPage(1); }}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Logs de erro
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="Busca" value={filters.q} onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))} />
          {tab === 'audit' ? (
            <>
              <Input label="Ação" value={filters.action} onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))} />
              <Input
                label="Entidade"
                value={filters.entityType}
                onChange={(event) => setFilters((prev) => ({ ...prev, entityType: event.target.value }))}
              />
              <Input
                label="ID do ator"
                value={filters.actorId}
                onChange={(event) => setFilters((prev) => ({ ...prev, actorId: event.target.value }))}
              />
            </>
          ) : (
            <>
              <Input
                label="Status HTTP"
                value={filters.statusCode}
                onChange={(event) => setFilters((prev) => ({ ...prev, statusCode: event.target.value }))}
              />
              <Input label="Path" value={filters.path} onChange={(event) => setFilters((prev) => ({ ...prev, path: event.target.value }))} />
              <Select label="Período rápido" onChange={(event) => {
                const value = event.target.value;
                if (!value) {
                  return;
                }
                const now = new Date();
                const from = new Date();
                from.setDate(now.getDate() - Number(value));
                setFilters((prev) => ({
                  ...prev,
                  dateFrom: from.toISOString().slice(0, 19),
                  dateTo: now.toISOString().slice(0, 19),
                }));
              }}>
                <option value="">Sem atalho</option>
                <option value="1">Último dia</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
              </Select>
            </>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Data inicial (ISO)"
            placeholder="2026-02-13T00:00:00"
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
          />
          <Input
            label="Data final (ISO)"
            placeholder="2026-02-13T23:59:59"
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
          <Button onClick={applyFilters}>
            <Search className="mr-2 h-4 w-4" />
            Aplicar filtros
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            {tab === 'audit' ? (
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Trace ID</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <tbody>
            {tab === 'audit'
              ? auditItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.timestamp).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{item.actor_email || '-'}</TableCell>
                    <TableCell>{item.action}</TableCell>
                    <TableCell>{item.entity_type}</TableCell>
                    <TableCell>{item.entity_id}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>Ver</Button>
                    </TableCell>
                  </TableRow>
                ))
              : errorItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.timestamp).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{item.status_code}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell>{item.path}</TableCell>
                    <TableCell className="font-mono text-xs">{item.trace_id}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>Ver</Button>
                    </TableCell>
                  </TableRow>
                ))}
          </tbody>
        </Table>

        {loading ? <div className="p-6 text-center text-gray-500">Carregando...</div> : null}
        {!loading && (tab === 'audit' ? auditItems.length === 0 : errorItems.length === 0) ? (
          <div className="p-6 text-center text-gray-500">Nenhum registro encontrado.</div>
        ) : null}

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-500">
          <span>Total: {count}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Anterior</Button>
            <span className="px-2 py-1">Página {page}</span>
            <Button variant="outline" disabled={!canGoNext} onClick={() => setPage((prev) => prev + 1)}>Próxima</Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={tab === 'audit' ? 'Detalhes da auditoria' : 'Detalhes do erro'}
        maxWidth="max-w-3xl"
      >
        {selectedItem ? (
          <div className="space-y-3">
            <pre className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs overflow-auto">
              {JSON.stringify(selectedItem, null, 2)}
            </pre>
            {'details_json' in selectedItem ? (
              <pre className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs overflow-auto">
                {JSON.stringify(selectedItem.details_json, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
