import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useGitOpsTranslation } from '../../utils/hooks/useGitOpsTranslation';

import ArgoCDNavPage from './ArgoCDNavPage';

const ArgoCDDetailsPage: React.FC = () => {
  const { t } = useGitOpsTranslation();
  const { name, ns } = useParams<{ name?: string; ns?: string }>();

  if (!name || !ns) {
    return <div>{t('Error: Missing required route parameters')}</div>;
  }

  return <ArgoCDNavPage name={name} namespace={ns} kind="ArgoCD" />;
};

export default ArgoCDDetailsPage;
