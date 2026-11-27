import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';

import ActionsDropdown from '@gitops/utils/components/ActionDropDown/ActionDropDown';
import {
  HealthDegradedIcon,
  HealthHealthyIcon,
  HealthProgressingIcon,
  HealthUnknownIcon,
} from '@gitops/utils/components/Icons/Icons';
import { modelToGroupVersionKind } from '@gitops/utils/utils';
import {
  Action,
  K8sResourceCommon,
  ListPageBody,
  ListPageCreate,
  ListPageFilter,
  ListPageHeader,
  ResourceLink,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { ErrorState } from '@patternfly/react-component-groups';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import type { DataViewTd } from '@patternfly/react-data-view/dist/esm/DataViewTable';
import { DataViewTh, DataViewTr } from '@patternfly/react-data-view/dist/esm/DataViewTable';
import { CubesIcon } from '@patternfly/react-icons';
import { Tbody, Td, ThProps, Tr } from '@patternfly/react-table';

import { ArgoCDKind, ArgoCDModel, argoCDModelRef } from '../../models/ArgoCDModel';
import {
  ShowOperandsInAllNamespacesRadioGroup,
  useShowOperandsInAllNamespaces,
} from '../shared/AllNamespaces';
import {
  ARGOCD_LIST_COLUMN_MANAGEMENT_ID,
  getArgoCDManagedColumns,
} from '../shared/argoCDListColumns';
import {
  type GitOpsManagedColumn,
  NAMESPACE_COLUMN_ID,
  useGitOpsColumnManagement,
} from '../shared/ColumnManagement';
import {
  GitOpsDataViewTable,
  useGitOpsDataViewSort,
  useGitOpsListPagePagination,
} from '../shared/DataView';
import { AgeCell } from '../shared/dateUtils';
import { GitOpsListPageToolbar } from '../shared/GitOpsListPageToolbar';
import { filterByConsoleNameAndLabels, parseLabelFilterParam } from '../shared/listPageTextFilters';

import { useArgoCDActionsProvider } from './hooks/useArgoCDActionsProvider';
import {
  ARGOCD_STATUS_FILTER_PARAM,
  ArgoCDStatus,
  filterArgoCDsByStatus,
  getArgoCDRowFilters,
  getArgoCDStatus,
} from './argoCDListFilters';

import './ArgoCD-list.scss';

type ArgoCDListTabProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
  showTitle?: boolean;
};

const ArgoCDList: React.FC<ArgoCDListTabProps> = ({
  namespace,
  hideNameLabelFilters,
  showTitle,
}) => {
  const location = useLocation();
  const [showOperandsInAllNamespaces] = useShowOperandsInAllNamespaces();
  const listAllNamespaces =
    location.pathname?.includes('openshift-gitops-operator') && showOperandsInAllNamespaces;
  const effectiveNamespace = listAllNamespaces ? null : namespace;
  const [ArgoCDs, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    groupVersionKind: modelToGroupVersionKind(ArgoCDModel),
    namespaced: !listAllNamespaces,
    namespace: effectiveNamespace,
  });

  const { t } = useTranslation('plugin__gitops-plugin');
  const includeNamespaceColumn = !effectiveNamespace || effectiveNamespace === '';
  const managedColumns = React.useMemo(() => getArgoCDManagedColumns(true, t), [t]);

  const { activeColumnIds, columnManagement, filterDataView, tableID } = useGitOpsColumnManagement({
    columnManagementID: ARGOCD_LIST_COLUMN_MANAGEMENT_ID,
    columns: managedColumns,
    resourceType: t('ArgoCD'),
    includeNamespaceColumn,
    showNamespaceHelp: includeNamespaceColumn,
  });

  const columnSortConfig = React.useMemo(
    () =>
      managedColumns.filter((column) => !column.alwaysShown).map((column) => ({ key: column.id })),
    [managedColumns],
  );

  const { searchParams, sortBy, direction, getSortParams } =
    useGitOpsDataViewSort(columnSortConfig);

  // Get search query from URL parameters
  const searchQuery = searchParams.get('q') || '';
  const nameQuery = searchParams.get('name') || '';
  const labelsParam = searchParams.get('labels') || '';
  const statusFilterParam = searchParams.get(ARGOCD_STATUS_FILTER_PARAM);

  const columnsDV = useColumnsDV(managedColumns, getSortParams, columnSortConfig);
  const sortedItems = React.useMemo(() => {
    return sortData(ArgoCDs as ArgoCDKind[], sortBy, direction);
  }, [ArgoCDs, sortBy, direction]);

  const filters = React.useMemo(() => getArgoCDRowFilters(t), [t]);
  const [data, , onFilterChange] = useListPageFilter(sortedItems, filters);

  const filteredByStatus = React.useMemo(
    () => filterArgoCDsByStatus(data as ArgoCDKind[], parseLabelFilterParam(statusFilterParam)),
    [data, statusFilterParam],
  );

  const filteredByNameAndLabels = React.useMemo(
    () =>
      filterByConsoleNameAndLabels(filteredByStatus, nameQuery, parseLabelFilterParam(labelsParam)),
    [filteredByStatus, nameQuery, labelsParam],
  );

  const filteredBySearch = React.useMemo(() => {
    if (!searchQuery) return filteredByNameAndLabels;

    const lowerQuery = searchQuery.toLowerCase();
    return filteredByNameAndLabels.filter((item) => {
      const name = item.metadata?.name || '';
      const labels = item.metadata?.labels || {};
      return (
        name.toLowerCase().includes(lowerQuery) ||
        Object.entries(labels).some(([key, value]) => {
          const labelSelector = `${key}=${value || ''}`;
          return (
            labelSelector.toLowerCase().includes(lowerQuery) ||
            key.toLowerCase().includes(lowerQuery)
          );
        })
      );
    });
  }, [filteredByNameAndLabels, searchQuery]);

  const { pagination, pagedItems, itemCount } = useGitOpsListPagePagination({
    items: filteredBySearch as ArgoCDKind[],
    namespace: effectiveNamespace,
    searchParams,
  });
  const rows = useArgoCDRowsDV(pagedItems, managedColumns);
  const columnIds = React.useMemo(
    () => managedColumns.map((column) => column.id),
    [managedColumns],
  );
  const { columns: visibleColumnsDV, rows: visibleRows } = React.useMemo(
    () => filterDataView(columnsDV, rows, columnIds, activeColumnIds),
    [filterDataView, columnsDV, rows, columnIds, activeColumnIds],
  );

  const hasItems = React.useMemo(() => {
    return sortedItems.length > 0;
  }, [sortedItems]);

  const getEmptyStateBody = () => {
    if (searchQuery) {
      return (
        <>
          {t('No ArgoCD Instances match the search filter')} <strong>&quot;{searchQuery}&quot;</strong>
          .
          <br />
          {t('Try removing the filter or searching for a different term to see more ArgoCD Instances.')}
        </>
      );
    }
    return effectiveNamespace
      ? t('There are no ArgoCD Instances in this namespace.')
      : t('There are no ArgoCD Instances in all namespaces.');
  };

  const empty = (
    <Tbody>
      <Tr key="loading" ouiaId="table-tr-loading">
        <Td colSpan={visibleColumnsDV.length || columnsDV.length}>
          <EmptyState
            headingLevel="h4"
            icon={CubesIcon}
            titleText={searchQuery ? t('No matching ArgoCD Instances') : t('No ArgoCD Instances')}
          >
            <EmptyStateBody>{getEmptyStateBody()}</EmptyStateBody>
          </EmptyState>
        </Td>
      </Tr>
    </Tbody>
  );
  const error = loadError && (
    <Tbody>
      <Tr key="loading" ouiaId={'table-tr-loading'}>
        <Td colSpan={visibleColumnsDV.length || columnsDV.length}>
          <ErrorState
            titleText={t('Unable to load data')}
            bodyText={t(
              'There was an error retrieving ArgoCD Instances. Check your connection and reload the page.',
            )}
          />
        </Td>
      </Tr>
    </Tbody>
  );
  const isEmptyState = !loadError && visibleRows.length === 0;

  const listPageFilter = !hideNameLabelFilters && hasItems && (
    <ListPageFilter
      data={data}
      loaded={loaded}
      rowFilters={filters}
      onFilterChange={onFilterChange}
      nameFilterPlaceholder={t('Search by name...')}
    />
  );

  return (
    <div>
      {showTitle == undefined && (
        <ListPageHeader
          title={t('ArgoCD Instances')}
          helpText={
            location.pathname?.includes('openshift-gitops-operator') ? (
              <ShowOperandsInAllNamespacesRadioGroup />
            ) : null
          }
          hideFavoriteButton={false}
        >
          <ListPageCreate groupVersionKind={argoCDModelRef}>{t('Create ArgoCD')}</ListPageCreate>
        </ListPageHeader>
      )}
      <ListPageBody>
        {hasItems && (
          <GitOpsListPageToolbar filters={listPageFilter} columnManagement={columnManagement} />
        )}
        <GitOpsDataViewTable
          columns={visibleColumnsDV}
          rows={visibleRows}
          tableID={tableID}
          isEmpty={isEmptyState}
          emptyState={empty}
          isError={!!loadError}
          errorState={error || undefined}
          itemCount={itemCount}
          pagination={pagination}
        />
      </ListPageBody>
    </div>
  );
};

export const sortData = (
  data: ArgoCDKind[],
  sortBy: string | undefined,
  direction: 'asc' | 'desc' | undefined,
) => {
  if (!(sortBy && direction)) return data || [];
  if (!data) return [];

  return [...data].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.metadata?.name || '';
        bValue = b.metadata?.name || '';
        break;
      case 'namespace':
        aValue = a.metadata?.namespace || '';
        bValue = b.metadata?.namespace || '';
        break;
      case 'age':
        aValue = a.metadata?.creationTimestamp || '';
        bValue = b.metadata?.creationTimestamp || '';
      default:
        return 0;
    }

    if (direction === 'asc') {
      // eslint-disable-next-line no-nested-ternary
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      // eslint-disable-next-line no-nested-ternary
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
};

export const useColumnsDV = (
  managedColumns: GitOpsManagedColumn[],
  getSortParams: (columnIndex: number) => ThProps['sort'],
  columnSortConfig: { key: string }[],
): DataViewTh[] => {
  const { t } = useTranslation('plugin__gitops-plugin');

  const titleById: Record<string, string> = {
    name: t('Name'),
    [NAMESPACE_COLUMN_ID]: t('Namespace'),
    status: t('Status'),
    version: t('Version'),
    age: t('Age'),
    actions: t('Actions'),
  };

  return managedColumns.map((column) => {
    if (column.id === 'actions') {
      return {
        cell: titleById.actions,
      };
    }
    const sortIndex = columnSortConfig.findIndex((entry) => entry.key === column.id);
    return {
      cell: titleById[column.id] ?? column.title,
      props: {
        'aria-label': column.id,
        ...(sortIndex >= 0 ? { sort: getSortParams(sortIndex) } : {}),
      },
    };
  });
};

export const useArgoCDRowsDV = (
  ArgoCDList: ArgoCDKind[],
  managedColumns: GitOpsManagedColumn[],
): DataViewTr[] => {
  const rows: DataViewTr[] = [];
  if (ArgoCDList === undefined || ArgoCDList.length === 0) {
    return rows;
  }
  ArgoCDList.forEach((obj, index) => {
    const cellsById: Record<string, DataViewTd> = {
      name: {
        cell: (
          <div>
            <ResourceLink
              groupVersionKind={modelToGroupVersionKind(ArgoCDModel)}
              name={obj.metadata.name}
              namespace={obj.metadata.namespace}
              inline={true}
            />
          </div>
        ),
        id: 'name',
        dataLabel: 'Name',
      },
      [NAMESPACE_COLUMN_ID]: {
        cell: <ResourceLink kind="Namespace" name={obj.metadata.namespace} />,
        id: obj.metadata.namespace,
        dataLabel: 'Namespace',
      },
      status: {
        id: 'status',
        cell: <ArgoCDStatusCell ArgoCD={obj} />,
        dataLabel: 'Status',
      },
      version: {
        id: 'version',
        cell: obj.spec?.version || '-',
        dataLabel: 'Version',
      },
      age: {
        id: 'age',
        cell: <AgeCell creationTimestamp={obj.metadata?.creationTimestamp} />,
        dataLabel: 'Age',
      },
      actions: {
        id: 'actions-' + index,
        cell: <ArgoCDActionsCell ArgoCD={obj} index={index} />,
      },
    };

    rows.push(managedColumns.map((column) => cellsById[column.id]));
  });
  return rows;
};

const ArgoCDStatusCell: React.FC<{ ArgoCD: ArgoCDKind }> = ({ ArgoCD }) => {
  const { t } = useTranslation('plugin__gitops-plugin');

  const status = getArgoCDStatus(ArgoCD);

  const iconByStatus: Record<ArgoCDStatus, React.ReactNode> = {
    [ArgoCDStatus.HEALTHY]: <HealthHealthyIcon />,
    [ArgoCDStatus.DEGRADED]: <HealthDegradedIcon />,
    [ArgoCDStatus.PROGRESSING]: <HealthProgressingIcon />,
    [ArgoCDStatus.UNKNOWN]: <HealthUnknownIcon />,
  };

  const labelByStatus: Record<ArgoCDStatus, string> = {
    [ArgoCDStatus.HEALTHY]: t('Healthy'),
    [ArgoCDStatus.DEGRADED]: t('Degraded'),
    [ArgoCDStatus.PROGRESSING]: t('Progressing'),
    [ArgoCDStatus.UNKNOWN]: t('Unknown'),
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
      {iconByStatus[status]} {labelByStatus[status]}
    </div>
  );
};

const ArgoCDActionsCell: React.FC<{
  ArgoCD: ArgoCDKind;
  index: number;
}> = ({ ArgoCD, index }) => {
  const actionList: Action[] = useArgoCDActionsProvider(ArgoCD);
  return (
    <div className="gitops-ArgoCD-list__actions">
      <ActionsDropdown
        actions={actionList || []}
        id={'gitops-ArgoCD-actions-' + index}
        isKebabToggle={true}
      />
    </div>
  );
};

export default ArgoCDList;
