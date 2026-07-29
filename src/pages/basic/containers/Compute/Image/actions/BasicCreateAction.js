import CreateAction from 'pages/compute/containers/Image/actions/Create';

// Primary "Create Image" action rebound to the Basic create form.
export default class BasicCreateAction extends CreateAction {
  static id = 'basic-image-create';

  static path = '/basic/compute/image/create';
}
