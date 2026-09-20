/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

interface RouterContextType {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  navigate: (to: string) => void;
  isAdmin: boolean;
}

const RouterContext = createContext<RouterContextType | null>(null);

function matchRoute(pattern: string, actualPath: string): { matches: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = actualPath.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl(window.location.pathname + window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', to);
      setCurrentUrl(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const [pathname, search] = currentUrl.split('?');
  const query = useMemo(() => new URLSearchParams(search || ''), [search]);
  const isAdmin = pathname.startsWith('/admin');

  // Extract params for common dynamic patterns such as /admin/orders/:id
  const orderMatch = matchRoute('/admin/orders/:id', pathname);
  const params = useMemo(() => {
    if (orderMatch.matches) {
      return orderMatch.params;
    }
    return {};
  }, [orderMatch.matches, orderMatch.params]);

  const value = useMemo(
    () => ({
      path: pathname || '/',
      params,
      query,
      navigate,
      isAdmin,
    }),
    [pathname, params, query, navigate, isAdmin]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export const Link: React.FC<LinkProps> = ({
  to,
  children,
  className = '',
  activeClassName = '',
  onClick,
  ...rest
}) => {
  const { path, navigate } = useRouter();
  const isActive = path === to || (to !== '/' && path.startsWith(to));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`${className} ${isActive ? activeClassName : ''}`.trim()}
      {...rest}
    >
      {children}
    </a>
  );
};
