import * as React from 'react';

import ArgoCDList from './ArgoCDList';

type ArgoCDListTabProps = {
  namespace?: string;
  hideNameLabelFilters?: boolean;
  showTitle?: boolean;
};

const ArgoCDListTab: React.FC<ArgoCDListTabProps> = ({
  namespace,
  hideNameLabelFilters,
  showTitle,
}) => {
  return (
    <ArgoCDList
      namespace={namespace}
      hideNameLabelFilters={hideNameLabelFilters}
      showTitle={showTitle}
    />
  );
};

export default ArgoCDListTab;
