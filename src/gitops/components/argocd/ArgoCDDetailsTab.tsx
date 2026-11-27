import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import classNames from 'classnames';

import {
  DescriptionList,
  Flex,
  FlexItem,
  PageSection,
  PageSectionVariants,
  Title,
} from '@patternfly/react-core';

import { ArgoCDKind, ArgoCDModel } from '../../models/ArgoCDModel';
import { useGitOpsTranslation } from '../../utils/hooks/useGitOpsTranslation';
import BaseDetailsSummary, {

} from '../shared/BaseDetailsSummary/BaseDetailsSummary';

type ArgoCDDetailsTabProps = RouteComponentProps<{ ns: string; name: string }> & {
  obj?: ArgoCDKind;
};

const ArgoCDDetailsTab: React.FC<ArgoCDDetailsTabProps> = ({ obj }) => {
  const { t } = useGitOpsTranslation();

  if (!obj) return null;

  return (
    <>
      <PageSection
        variant={PageSectionVariants.default}
        className={classNames('co-m-pane__body', { 'co-m-pane__body--section-heading': true })}
      >
        <Title headingLevel="h2" className="co-section-heading">
          {t('ArgoCD details')}
        </Title>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceEvenly' }}
          direction={{ default: 'column', lg: 'row' }}
        >
          <Flex flex={{ default: 'flex_2' }}>
            <FlexItem fullWidth={{ default: 'fullWidth' }}>
              <BaseDetailsSummary obj={obj} model={ArgoCDModel} showOwner={false} />
            </FlexItem>
          </Flex>

          <Flex flex={{ default: 'flex_2' }} direction={{ default: 'column' }}>
            <FlexItem>
              <DescriptionList className="pf-v6-c-description-list">







              </DescriptionList>
            </FlexItem>
          </Flex>
        </Flex>
      </PageSection>

    </>
  );
};

export default ArgoCDDetailsTab;
