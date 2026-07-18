import CreateAction from 'pages/storage/containers/Volume/actions/Create';

// Primary "Create Volume" action rebound to the Basic single-page
// create form.
export default class BasicCreateAction extends CreateAction {
  static id = 'basic-volume-create';

  static path = '/basic/storage/volume/create';
}
