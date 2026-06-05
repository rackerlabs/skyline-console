import Base from 'stores/base';
import client from 'client';

export class JobExecutionStore extends Base {
  get client() {
    return client.qonos.jobs.executions;
  }

  get needGetProject() {
    return false;
  }

  get isSubResource() {
    return true;
  }

  getFatherResourceId = (params) => params.jobId || params.id;
}

export default new JobExecutionStore();
