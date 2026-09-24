// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import { get } from 'lodash';
import { ModalAction } from 'containers/Action';
import client from 'client';
import globalClustersStore from 'stores/magnum/clusters';
import { ClusterTemplatesStore } from 'stores/magnum/clusterTemplates';
import { ImageStore } from 'stores/glance/image';
import { allSettled } from 'utils';
import {
  CLUSTER_UPGRADE_HEALTH_STATUS,
  findImageByIdOrName,
  getClusterUpgradePathCheck,
  getImageKubeVersion,
  healthStatus,
  parseKubeVersion,
} from 'resources/magnum/cluster';

export class Upgrade extends ModalAction {
  static id = 'upgrade-cluster';

  static title = t('Upgrade Cluster');

  static buttonText = t('Upgrade');

  static policy = 'cluster:upgrade';

  // Only a healthy cluster may be upgraded.
  static allowed(item) {
    return Promise.resolve(
      get(item, 'health_status') === CLUSTER_UPGRADE_HEALTH_STATUS
    );
  }

  static get modalSize() {
    return 'middle';
  }

  getModalSize() {
    return 'middle';
  }

  get name() {
    return t('Upgrade Cluster');
  }

  get isAsyncAction() {
    return true;
  }

  init() {
    this.store = globalClustersStore;
    this.templateStore = new ClusterTemplatesStore();
    this.imageStore = new ImageStore();
    this.state.loading = true;
    this.state.coeVersion = this.item.coe_version || '';
    this.loadData();
  }

  async loadData() {
    await allSettled([
      this.getClusterVersion(),
      this.getClusterTemplates(),
      this.getImages(),
    ]);
    this.setState({ loading: false });
    this.updateDefaultValue();
  }

  // Row actions are built from the list payload, which does not always carry
  // `coe_version`, so fall back to reading the cluster itself.
  async getClusterVersion() {
    if (this.state.coeVersion) {
      return;
    }
    const result = await client.magnum.clusters.show(this.item.id);
    const cluster = get(result, 'cluster') || result || {};
    this.setState({ coeVersion: cluster.coe_version || '' });
  }

  getClusterTemplates() {
    return this.templateStore.fetchList();
  }

  getImages() {
    return this.imageStore.fetchList();
  }

  get coeVersion() {
    return this.state.coeVersion || '';
  }

  get templates() {
    return toJS(this.templateStore.list.data) || [];
  }

  get images() {
    return toJS(this.imageStore.list.data) || [];
  }

  get isLoading() {
    return (
      this.state.loading ||
      this.templateStore.list.isLoading ||
      this.imageStore.list.isLoading
    );
  }

  // The version a template upgrades to is the `kube_version` property of the
  // image the template references. `image_id` may be an image id or name.
  getTemplateKubeVersion(template) {
    const image = findImageByIdOrName(this.images, template.image_id);
    return getImageKubeVersion(image);
  }

  // Every template with its resolved version and eligibility. Kept around so
  // the validator can still explain a value that is not on offer.
  get templateChecks() {
    return this.templates.map((template) => {
      const kubeVersion = this.getTemplateKubeVersion(template);
      return {
        template,
        kubeVersion,
        ...getClusterUpgradePathCheck(this.coeVersion, kubeVersion),
      };
    });
  }

  // Only valid upgrade targets are offered, ordered so the nearest version
  // comes first.
  get templateOptions() {
    return this.templateChecks
      .filter((it) => it.allowed)
      .sort((a, b) => {
        const left = parseKubeVersion(a.kubeVersion);
        const right = parseKubeVersion(b.kubeVersion);
        if (left && right) {
          const diff =
            left.major - right.major ||
            left.minor - right.minor ||
            left.patch - right.patch;
          if (diff !== 0) {
            return diff;
          }
        }
        return (a.template.name || '').localeCompare(b.template.name || '');
      })
      .map(({ template, kubeVersion }) => ({
        value: template.id,
        label: `${template.name} (${kubeVersion})`,
      }));
  }

  get hasUpgradeTarget() {
    return this.templateOptions.length > 0;
  }

  get tips() {
    return t(
      'Only cluster templates that are a valid upgrade target are listed. The cluster is upgraded to the Kubernetes version of the image used by the selected template. Minor versions must be applied one at a time, patch versions within the current minor version may be skipped, and downgrades are not supported.'
    );
  }

  get defaultValue() {
    const [firstOption] = this.templateOptions;
    return {
      name: this.item.name,
      current_version: this.coeVersion || '-',
      health_status: healthStatus[this.item.health_status] || '-',
      // Preselect the nearest upgrade target. `loadData` re-applies the default
      // once the templates and images have resolved.
      cluster_template: firstOption ? firstOption.value : undefined,
    };
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Cluster'),
        type: 'label',
      },
      {
        name: 'current_version',
        label: t('Current Kubernetes Version'),
        type: 'label',
      },
      {
        name: 'health_status',
        label: t('Health Status'),
        type: 'label',
      },
      {
        name: 'cluster_template',
        label: t('Cluster Template'),
        type: 'select',
        options: this.templateOptions,
        loading: this.isLoading,
        required: true,
        placeholder: t('Please select a cluster template'),
        placement: 'bottomLeft',
        listHeight: 200,
        dropdownAlign: { overflow: { adjustX: 1, adjustY: 0 } },
        getPopupContainer: () => document.body,
        extra:
          !this.isLoading && !this.hasUpgradeTarget
            ? t(
                'No cluster template offers a valid upgrade target for this cluster.'
              )
            : '',
        // Ineligible templates are not listed, so this only catches a value
        // that was set before the template and image data settled.
        validator: (rule, value) => {
          if (!value || this.isLoading) {
            return Promise.resolve();
          }
          if (this.templateOptions.some((it) => it.value === value)) {
            return Promise.resolve();
          }
          const check = this.templateChecks.find(
            (it) => it.template.id === value
          );
          return Promise.reject(
            new Error(
              (check && check.reason) ||
                t('This cluster template can not be used for an upgrade.')
            )
          );
        },
      },
    ];
  }

  onSubmit = (values) => {
    const { cluster_template: clusterTemplate } = values;
    return this.store.upgrade(
      { id: this.item.id },
      { cluster_template: clusterTemplate }
    );
  };
}

export default inject('rootStore')(observer(Upgrade));
