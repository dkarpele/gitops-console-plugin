import * as React from 'react';

import { modelToGroupVersionKind } from '@gitops/utils/utils';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { ErrorState } from '@patternfly/react-component-groups';
import { Bullseye, Spinner } from '@patternfly/react-core';

import { ArgoCDKind, ArgoCDModel } from '../../models/ArgoCDModel';
import { useGitOpsTranslation } from '../../utils/hooks/useGitOpsTranslation';
import DetailsPageHeader from '../shared/DetailsPageHeader/DetailsPageHeader';
import ResourceYAMLTab from '../shared/ResourceYAMLTab/ResourceYAMLTab';

import { useArgoCDActionsProvider } from './hooks/useArgoCDActionsProvider';
import ArgoCDDetailsTab from './ArgoCDDetailsTab';

type ArgoCDPageProps = {
  name: string;
  namespace: string;
  kind: string;
};

const ArgoCDNavPage: React.FC<ArgoCDPageProps> = ({ name, namespace, kind }) => {
  const { t } = useGitOpsTranslation();
  const [ArgoCD, loaded, loadError] = useK8sWatchResource<ArgoCDKind>({
    groupVersionKind: modelToGroupVersionKind(ArgoCDModel),
    kind,
    name,
    namespace,
  });

  const actions = useArgoCDActionsProvider(ArgoCD);

  const pages = React.useMemo(
    () => [
      {
        href: '',
        name: t('Details'),
        component: ArgoCDDetailsTab,
      },
      {
        href: 'yaml',
        name: t('YAML'),
        component: ResourceYAMLTab,
      },
    ],
    [t],
  );

  return (
    <>
      <DetailsPageHeader
        obj={ArgoCD}
        model={ArgoCDModel}
        namespace={namespace}
        name={name}
        actions={actions}
        iconText="IU"
        iconTitle={t('ArgoCD ArgoCD')}
      />
      {/* eslint-disable-next-line no-nested-ternary */}
      {loaded && !loadError ? (
        <div>
          <HorizontalNav pages={pages} resource={ArgoCD} />
        </div>
      ) : loadError ? (
        <ErrorState
          titleText={t('Unable to load data')}
          bodyText={t(
            'There was an error retrieving the ArgoCD. Check your connection and reload the page.',
          )}
        />
      ) : (
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      )}
    </>
  );
};

export default ArgoCDNavPage;
