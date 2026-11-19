import { action, observable, runInAction } from 'mobx';
import swiftClient from 'client/swift';
import {
  getObjectVersionMetadata,
  getVersionId,
  isDeleteMarker,
  mergeObjectVersions,
} from 'resources/swift/object-version';
import { getSwiftErrorBody } from 'resources/swift/versioning';

export const VERSION_PAGE_SIZE = 100;

export default class ObjectVersionStore {
  @observable rows = [];

  @observable loading = false;

  @observable hasMore = true;

  @observable error = '';

  cursor = null;

  constructor(container, name, client = swiftClient.container) {
    this.container = container;
    this.name = name;
    this.client = client;
  }

  @action
  loadMore = async () => {
    if (this.loading || !this.hasMore) {
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      const params = { limit: VERSION_PAGE_SIZE };
      if (this.cursor) {
        params.marker = this.cursor.name;
        params.version_marker = getVersionId(this.cursor);
      }
      const page = await this.client.listObjectVersions(
        this.container,
        this.name,
        params
      );
      runInAction(() => {
        this.rows = mergeObjectVersions(this.rows, page, this.name);
        this.hasMore =
          page.length >= VERSION_PAGE_SIZE &&
          page.every((row) => row.name === this.name);
        if (page.length) {
          this.cursor = page[page.length - 1];
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = getSwiftErrorBody(error);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  fetchMetadata = async (row) => {
    const { headers } = await this.client.showObjectVersionMetadata(
      this.container,
      this.name,
      getVersionId(row)
    );
    return getObjectVersionMetadata(headers, row.bytes);
  };

  download = (row) => {
    if (isDeleteMarker(row)) {
      return Promise.reject(
        new Error(t('Deleted versions cannot be downloaded.'))
      );
    }
    return this.client.downloadObjectVersion(
      this.container,
      this.name,
      getVersionId(row)
    );
  };
}
