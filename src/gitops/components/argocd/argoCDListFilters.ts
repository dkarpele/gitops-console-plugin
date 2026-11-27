import { RowFilter } from '@openshift-console/dynamic-plugin-sdk';

import { ArgoCDKind } from '../../models/ArgoCDModel';

export const ARGOCD_STATUS_FILTER_TYPE = 'argocd-status';
export const ARGOCD_STATUS_FILTER_PARAM = `rowFilter-${ARGOCD_STATUS_FILTER_TYPE}`;

export enum ArgoCDStatus {
  HEALTHY = 'Healthy',
  DEGRADED = 'Degraded',
  PROGRESSING = 'Progressing',
  UNKNOWN = 'Unknown',
}

export const getArgoCDStatus = (ArgoCD: Pick<ArgoCDKind, 'status'> | undefined): ArgoCDStatus => {
  const status = ArgoCD?.status;
  if (!status) return ArgoCDStatus.UNKNOWN;

  const controllerStatuses = [
    status.applicationController,
    status.applicationSetController,
    status.sso,
    status.repo,
    status.server,
    status.redis,
  ];

  if (controllerStatuses.some((controllerStatus) => controllerStatus === 'Failed')) {
    return ArgoCDStatus.DEGRADED;
  }
  if (controllerStatuses.some((controllerStatus) => controllerStatus === 'Unknown')) {
    return ArgoCDStatus.UNKNOWN;
  }
  if (controllerStatuses.some((controllerStatus) => controllerStatus === 'Pending')) {
    return ArgoCDStatus.PROGRESSING;
  }
  if (controllerStatuses.every((controllerStatus) => controllerStatus === 'Running')) {
    return ArgoCDStatus.HEALTHY;
  }
  return ArgoCDStatus.UNKNOWN;
};

export const matchesArgoCDStatusFilter = (
  selected: string[] | undefined,
  ArgoCD: Pick<ArgoCDKind, 'status'> | undefined,
): boolean => {
  if (!selected?.length) {
    return true;
  }
  return selected.includes(getArgoCDStatus(ArgoCD));
};

export const filterArgoCDsByStatus = (
  ArgoCDs: ArgoCDKind[] | undefined,
  statusSelected: string[],
): ArgoCDKind[] =>
  (ArgoCDs ?? []).filter((ArgoCD) => matchesArgoCDStatusFilter(statusSelected, ArgoCD));

export const getArgoCDRowFilters = (t: (key: string) => string): RowFilter[] => [
  {
    filterGroupName: t('Status'),
    type: ARGOCD_STATUS_FILTER_TYPE,
    reducer: (ArgoCD) => getArgoCDStatus(ArgoCD),
    filter: (input, ArgoCD) => matchesArgoCDStatusFilter(input.selected, ArgoCD),
    items: [
      { id: ArgoCDStatus.HEALTHY, title: ArgoCDStatus.HEALTHY },
      { id: ArgoCDStatus.PROGRESSING, title: ArgoCDStatus.PROGRESSING },
      { id: ArgoCDStatus.DEGRADED, title: ArgoCDStatus.DEGRADED },
      { id: ArgoCDStatus.UNKNOWN, title: ArgoCDStatus.UNKNOWN },
    ],
  },
];
