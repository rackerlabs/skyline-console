import { action, observable, runInAction } from 'mobx';
import swiftClient from 'client/swift';
import {
  canRestoreVersion,
  createVersionGoneError,
  getObjectVersionIdHeader,
  getObjectVersionMetadata,
  getVersionId,
  isDeleteMarker,
  isLargeObjectHeaders,
  mergeObjectVersions,
} from 'resources/swift/object-version';
import { getSwiftErrorBody } from 'resources/swift/versioning';

export const VERSION_PAGE_SIZE = 100;

const isNotFound = (error) =>
  !!(error && error.response && error.response.status === 404);

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

  @action
  reload = async () => {
    runInAction(() => {
      this.rows = [];
      this.cursor = null;
      this.hasMore = true;
      this.error = '';
      this.loading = false;
    });
    await this.loadMore();
  };

  headVersion = async (row) => {
    const { headers } = await this.client.showObjectVersionMetadata(
      this.container,
      this.name,
      getVersionId(row)
    );
    return headers || {};
  };

  fetchMetadata = async (row) =>
    getObjectVersionMetadata(await this.headVersion(row), row.bytes);

  isLargeObject = async (row) =>
    isLargeObjectHeaders(await this.headVersion(row));

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

  runRestoreCall = async (row, request) => {
    if (!canRestoreVersion(row)) {
      throw new Error(t('This version cannot be restored.'));
    }
    try {
      return await request();
    } catch (error) {
      if (isNotFound(error)) {
        throw createVersionGoneError();
      }
      throw error;
    }
  };

  restore = (row) =>
    this.runRestoreCall(row, () =>
      this.client.restoreObjectVersion(
        this.container,
        this.name,
        getVersionId(row)
      )
    );

  restoreAsNewVersion = (row) =>
    this.runRestoreCall(row, async () => {
      const response = await this.client.copyObjectVersion(
        this.container,
        this.name,
        getVersionId(row)
      );
      return getObjectVersionIdHeader((response && response.headers) || {});
    });
}
