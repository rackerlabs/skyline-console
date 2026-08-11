import React from 'react';
import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import globalExecutionProfileStore, {
  ExecutionProfileStore,
} from 'stores/qonos/execution-profile';
import { qonosEndpoint } from 'client/client/constants';
import { fetchExecutionProfilesForProject } from 'resources/qonos';
import { getIdRender, getNameRenderWithStyle } from 'utils/table';
import actionConfigs from './actions';

export class ExecutionProfile extends Base {
  init() {
    this.store = globalExecutionProfileStore;
    this.downloadStore = new ExecutionProfileStore();
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'qonos:execution_profiles:get';
  }

  get endpoint() {
    return qonosEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('execution profiles');
  }

  get fetchDataByAllProjects() {
    return false;
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getData = async ({ silent } = {}) => {
    silent && (this.list.silent = true);
    try {
      await fetchExecutionProfilesForProject(
        this.store,
        this.currentUser?.user?.id,
        this.currentUser?.project?.id || this.currentProjectId
      );
    } catch (e) {
      this.list.data = [];
    } finally {
      this.list.silent = false;
    }
  };

  get searchFilters() {
    return [
      {
        label: t('ID'),
        name: 'id',
      },
      {
        label: t('Name'),
        name: 'name',
      },
      {
        label: t('Enabled'),
        name: 'enabled',
        options: [
          { label: t('Yes'), value: true },
          { label: t('No'), value: false },
        ],
      },
    ];
  }

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      render: (value, record) => (
        <div>
          <div>{getIdRender(record.id, true, true)}</div>
          {getNameRenderWithStyle(value, true)}
        </div>
      ),
    },
    {
      title: t('Auth Type'),
      dataIndex: 'auth_type',
    },
    {
      title: t('Trust ID'),
      dataIndex: 'trust_id',
    },
    {
      title: t('Enabled'),
      dataIndex: 'enabled',
      valueRender: 'yesNo',
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
    {
      title: t('Updated At'),
      dataIndex: 'updated_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(ExecutionProfile));
