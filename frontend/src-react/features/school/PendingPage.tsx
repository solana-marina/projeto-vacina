import React from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, Button, Card, Input, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/core';
import { useAuth } from '../../context/AuthContext';
import { formatAgeMonths } from '../../lib/age';
import { parseApiError } from '../../lib/errors';
import { api } from '../../services/api';
import { Student } from '../../types/api';

export function PendingPage() {
  const { session } = useAuth();
  const [query, setQuery] = React.useState('');
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.listStudents({
        page: 1,
        q: query || undefined,
        schoolId: session?.schoolId ?? undefined,
      });
      const pendingOnly = response.results.filter((student) =>
        ['ATRASADO', 'SEM_DADOS', 'INCOMPLETO'].includes(student.current_status),
      );
      setStudents(pendingOnly);
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível carregar pendências.'));
    } finally {
      setLoading(false);
    }
  }, [query, session?.schoolId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const atrasados = students.filter((student) => student.current_status === 'ATRASADO').length;
  const semDados = students.filter((student) => student.current_status === 'SEM_DADOS').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900">Pendências da escola</h1>
          <p className="text-gray-500">Acompanhe estudantes atrasados, incompletos ou sem dados.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar lista
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4 bg-red-50 border-red-100 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-red-600 font-medium">Atrasados</p>
            <p className="text-2xl font-bold text-red-700">{atrasados}</p>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-100 flex items-center gap-3">
          <div className="rounded-full bg-yellow-100 p-2">
            <AlertCircle className="h-5 w-5 text-yellow-700" />
          </div>
          <div>
            <p className="text-sm text-yellow-700 font-medium">Sem dados</p>
            <p className="text-2xl font-bold text-yellow-800">{semDados}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar estudante..." className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudante</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell>{formatAgeMonths(student.age_months)}</TableCell>
                <TableCell>
                  <Badge status={student.current_status} />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>

        {loading ? <div className="p-6 text-center text-gray-500">Carregando...</div> : null}
        {!loading && students.length === 0 ? <div className="p-6 text-center text-gray-500">Nenhuma pendência encontrada.</div> : null}
      </Card>
    </div>
  );
}
