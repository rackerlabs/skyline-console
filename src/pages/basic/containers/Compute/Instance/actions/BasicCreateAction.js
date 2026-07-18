import StepCreateAction from 'pages/compute/containers/Instance/actions/StepCreate';

// Primary "Create Instance" action rebound to the Basic single-page
// create form.
export default class BasicCreateAction extends StepCreateAction {
  static id = 'basic-instance-create';

  static path = '/basic/compute/instance/create';
}
