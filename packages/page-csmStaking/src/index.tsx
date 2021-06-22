// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
import type { AppProps as Props } from '@polkadot/react-components/types';
import type { ActiveEraInfo } from '@polkadot/types/interfaces';

import BN from 'bn.js';
import React, { useEffect, useRef, useState } from 'react';
import { Route, Switch } from 'react-router';

import { useTranslation } from '@polkadot/apps/translate';
import { Tabs } from '@polkadot/react-components';
import { useAccounts, useApi, useCall, useIpfs } from '@polkadot/react-hooks';

import { ProviderState } from './Actions/partials/types';
import { SummaryInfo } from './Overview/Summary';
import Actions from './Actions';
import { httpGet } from './http';
import Overview from './Overview';

const HIDDEN_ACC = ['vanity'];

const Capacity_Unit = new BN(1024 * 1024);

function CsmStakingApp ({ basePath, onStatusChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hasAccounts } = useAccounts();
  const { isIpfs } = useIpfs();
  const { api } = useApi();
  const activeEraInfo = useCall<ActiveEraInfo>(api.query.staking.activeEra);
  const activeEra = activeEraInfo && (JSON.parse(JSON.stringify(activeEraInfo)).index);
  const [providers, setProviders] = useState<ProviderState[]>([]);
  const [summaryInfo, setSummaryInfo] = useState<SummaryInfo | null>();
  const [isLoading, setIsloading] = useState<boolean>(true);

  useEffect(() => {
    if (activeEra) {
      const lastEra = activeEra - 1;

      httpGet('http://crust-sg1.ownstack.cn:8866/overview/' + lastEra).then((res) => {
        setProviders(res?.statusText.providers);
        setSummaryInfo({
          calculatedRewards: res?.statusText.calculatedRewards,
          totalEffectiveStakes: res?.statusText.totalEffectiveStakes,
          dataPower: Capacity_Unit.mul(new BN(Number(res?.statusText.dataPower)))
        });
        setIsloading(false);
      }).catch(() => setIsloading(true));
    }
  }, [activeEra]);

  const itemsRef = useRef([
    {
      isRoot: true,
      name: 'overview',
      text: t<string>('Overview')
    },
    {
      name: 'actions',
      text: t<string>('Account actions')
    }

  ]);

  return (
    <main className='accounts--App'>
      <header>
        <Tabs
          basePath={basePath}
          hidden={(hasAccounts && !isIpfs) ? undefined : HIDDEN_ACC}
          items={itemsRef.current}
        />
      </header>
      <Switch>
        <Route path={`${basePath}/actions`}>
          <Actions providers={providers.map((e) => e.account)} />
        </Route>
        <Route basePath={basePath}
          onStatusChange={onStatusChange}>
          <Overview isLoading={isLoading}
            providers={providers}
            summaryInfo={summaryInfo} />
        </Route>

      </Switch>
    </main>
  );
}

export default React.memo(CsmStakingApp);
