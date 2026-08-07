import React from 'react';

import { Button, Card, Input, Select } from '../ui/core';
import { School, Vaccine } from '../../types/api';

export interface StudentFilterValues {
  q: string;
  schoolId: string;
  vaccineId: string;
  status: string;
  sex: string;
  ageMinYears: string;
  ageMinMonths: string;
  ageMaxYears: string;
  ageMaxMonths: string;
}

interface StudentFiltersPanelProps {
  values: StudentFilterValues;
  onChange: (field: keyof StudentFilterValues, value: string) => void;
  onApply: () => void;
  schools: School[];
  vaccines: Vaccine[];
  showSchoolFilter?: boolean;
  applyButtonLabel?: string;
  applyButtonTestId?: string;
  applyButtonIcon?: React.ReactNode;
  namePlaceholder?: string;
}

function HelpHint({ text }: { text: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <span className="relative inline-flex items-center" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onBlur={() => setIsOpen(false)}
        aria-label="Explicação do status"
        aria-expanded={isOpen}
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`absolute left-0 top-full mt-2 z-[70] w-72 max-w-[calc(100vw-2rem)] whitespace-normal break-words rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-normal leading-relaxed text-gray-700 shadow-lg ${isOpen ? 'block' : 'hidden'}`}
      >
        {text}
      </span>
    </span>
  );
}

export function StudentFiltersPanel({
  values,
  onChange,
  onApply,
  schools,
  vaccines,
  showSchoolFilter = true,
  applyButtonLabel = 'Aplicar',
  applyButtonTestId,
  applyButtonIcon,
  namePlaceholder = 'Buscar estudante',
}: StudentFiltersPanelProps) {
  return (
    <Card className="p-4">
      <div className={`grid grid-cols-1 gap-4 ${showSchoolFilter ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
        <div className="lg:col-span-2">
          <Input label="Nome" placeholder={namePlaceholder} value={values.q} onChange={(event) => onChange('q', event.target.value)} />
        </div>

        {showSchoolFilter ? (
          <Select label="Escola" value={values.schoolId} onChange={(event) => onChange('schoolId', event.target.value)}>
            <option value="">Todas</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </Select>
        ) : null}

        <Select label="Vacina" value={values.vaccineId} onChange={(event) => onChange('vaccineId', event.target.value)}>
          <option value="">Todas</option>
          {vaccines.map((vaccine) => (
            <option key={vaccine.id} value={vaccine.id}>
              {vaccine.code} - {vaccine.name}
            </option>
          ))}
        </Select>

        <Select
          label={
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              Status
              <HelpHint text="Em dia: sem dose pendente para a idade atual. Pendente: há dose liberada por idade que ainda não foi registrada. Atrasado: há dose pendente e o prazo máximo já passou." />
            </span>
          }
          value={values.status}
          onChange={(event) => onChange('status', event.target.value)}
        >
          <option value="">Todos</option>
          <option value="EM_DIA">Em dia</option>
          <option value="ATRASADO">Atrasado</option>
          <option value="INCOMPLETO">Pendente</option>
        </Select>

        <Select label="Sexo" value={values.sex} onChange={(event) => onChange('sex', event.target.value)}>
          <option value="">Todos</option>
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
          <option value="NI">Não informado</option>
        </Select>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Input label="Idade mínima (anos)" type="number" min={0} value={values.ageMinYears} onChange={(event) => onChange('ageMinYears', event.target.value)} />
        <Input
          label="Idade mínima (meses)"
          type="number"
          min={0}
          max={11}
          value={values.ageMinMonths}
          onChange={(event) => onChange('ageMinMonths', event.target.value)}
        />
        <Input label="Idade máxima (anos)" type="number" min={0} value={values.ageMaxYears} onChange={(event) => onChange('ageMaxYears', event.target.value)} />
        <Input
          label="Idade máxima (meses)"
          type="number"
          min={0}
          max={11}
          value={values.ageMaxMonths}
          onChange={(event) => onChange('ageMaxMonths', event.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button data-testid={applyButtonTestId} onClick={onApply} className="w-full sm:w-auto">
          {applyButtonIcon}
          {applyButtonLabel}
        </Button>
      </div>
    </Card>
  );
}
