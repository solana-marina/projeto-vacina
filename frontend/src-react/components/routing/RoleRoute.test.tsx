import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import * as AuthContextModule from '../../context/AuthContext';
import { RoleRoute } from './RoleRoute';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RoleRoute', () => {
  it('permite acesso para perfil autorizado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: () => true,
      getDefaultRoute: () => '/admin/students',
    } as never);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <div>Conteúdo protegido</div>
              </RoleRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('redireciona quando perfil não autorizado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      hasAnyRole: () => false,
      getDefaultRoute: () => '/school/students',
    } as never);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <div>Conteúdo protegido</div>
              </RoleRoute>
            }
          />
          <Route path="/school/students" element={<div>Home escola</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home escola')).toBeInTheDocument();
  });
});
