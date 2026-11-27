import { type GitOpsManagedColumn, buildGitOpsManagedColumns } from './ColumnManagement';

export const ARGOCD_LIST_COLUMN_MANAGEMENT_ID = 'gitops.argocd';

export const getArgoCDManagedColumns = (
  includeNamespaceColumn: boolean,
  t: (key: string) => string,
): GitOpsManagedColumn[] =>
  buildGitOpsManagedColumns(includeNamespaceColumn, t, [
    { id: 'status', title: t('Status'), isShownByDefault: true },
    { id: 'app-counter', title: t('App count'), isShownByDefault: true },
    { id: 'version', title: t('Version'), isShownByDefault: true },
    { id: 'age', title: t('Age'), isShownByDefault: true },
  ]);
