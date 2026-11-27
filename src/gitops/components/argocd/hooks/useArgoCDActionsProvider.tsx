import * as React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import {
  Action,
  K8sVerb,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';

import {
  ArgoCDKind,
  ArgoCDModel,
  argoCDModelRef
} from '../../../models/ArgoCDModel';
import { useGitOpsTranslation } from '../../../utils/hooks/useGitOpsTranslation';

type UseArgoCDActionsProvider = (ArgoCD: ArgoCDKind) => Action[];

export const useArgoCDActionsProvider: UseArgoCDActionsProvider = (ArgoCD) => {
  const { t } = useGitOpsTranslation();
  const navigate = useNavigate();
  const launchLabelsModal = useLabelsModal(ArgoCD);
  const launchAnnotationsModal = useAnnotationsModal(ArgoCD);
  const launchDeleteModal = useDeleteModal(ArgoCD);

  const actions = React.useMemo(
    () => [
      {
        id: 'gitops-action-edit-labels-ArgoCD',
        disabled: false,
        label: t('Edit labels'),
        accessReview: {
          group: ArgoCDModel.apiGroup,
          verb: 'patch' as K8sVerb,
          resource: ArgoCDModel.plural,
          namespace: ArgoCD?.metadata?.namespace,
        },
        cta: () => {
          launchLabelsModal();
        },
      },
      {
        id: 'gitops-action-edit-annotations-ArgoCD',
        disabled: false,
        label: t('Edit annotations'),
        accessReview: {
          group: ArgoCDModel.apiGroup,
          verb: 'patch' as K8sVerb,
          resource: ArgoCDModel.plural,
          namespace: ArgoCD?.metadata?.namespace,
        },
        cta: () => {
          launchAnnotationsModal();
        },
      },
      {
        id: 'gitops-action-edit-ArgoCD',
        disabled: !ArgoCD?.metadata?.namespace || !ArgoCD?.metadata?.name,
        label: t('Edit ArgoCD'),
        accessReview: {
          group: ArgoCDModel.apiGroup,
          verb: 'update' as K8sVerb,
          resource: ArgoCDModel.plural,
          namespace: ArgoCD?.metadata?.namespace,
        },
        cta: () => {
          if (!ArgoCD?.metadata?.namespace || !ArgoCD?.metadata?.name) {
            return;
          }
          navigate(
            `/k8s/ns/${ArgoCD?.metadata?.namespace}/${argoCDModelRef}/${ArgoCD?.metadata?.name}/yaml`,
          );
        },
      },
      {
        id: 'gitops-action-delete-ArgoCD',
        disabled: false,
        label: t('Delete ArgoCD'),
        accessReview: {
          group: ArgoCDModel.apiGroup,
          verb: 'delete' as K8sVerb,
          resource: ArgoCDModel.plural,
          namespace: ArgoCD?.metadata?.namespace,
        },
        cta: () => launchDeleteModal(),
      },
    ],
    [ArgoCD, launchLabelsModal, launchAnnotationsModal, launchDeleteModal, navigate, t],
  );

  return actions;
};
