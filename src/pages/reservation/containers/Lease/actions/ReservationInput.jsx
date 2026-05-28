import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Select,
  Input,
  InputNumber,
  Row,
  Col,
  Alert,
  Checkbox,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import client from 'client';
import { isExternalNetwork } from 'resources/neutron/network';
import {
  beforeEndOptions,
  HYPERVISOR_OPERATORS,
  isBlazarInternalAvailabilityZone,
  RESERVATION_TYPES,
  reservationTypeOptions,
} from 'resources/blazar/reservation';
import './ReservationInput.less';

const { Option } = Select;
const { TextArea } = Input;

const blockStyle = {
  marginBottom: 12,
  padding: 12,
  border: '1px solid #d9d9d9',
  borderRadius: 4,
};

const labelStyle = {
  marginBottom: 4,
};

const controlStyle = {
  width: '100%',
};

class ReservationInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      availabilityZoneLoading: false,
      availabilityZones: [],
      flavors: [],
      flavorLoading: false,
      networks: [],
      networkLoading: false,
      hostCount: null,
      hostCountLoading: false,
    };
  }

  componentDidMount() {
    this.fetchAvailabilityZones();
    this.fetchFlavors();
    this.fetchNetworks();
    this.fetchHostCount();
  }

  get reservations() {
    const { value } = this.props;
    if (value && value.length) {
      return value;
    }
    return [this.getDefaultReservation(RESERVATION_TYPES.HOST)];
  }

  get hasHostReservation() {
    return this.reservations.some(
      (it) => it.resource_type === RESERVATION_TYPES.HOST
    );
  }

  fetchAvailabilityZones = async () => {
    this.setState({ availabilityZoneLoading: true });
    try {
      const result = await client.nova.zone.list();
      this.setState({
        availabilityZones: (result.availabilityZoneInfo || [])
          .filter((zone) => (zone.zoneState || {}).available)
          .filter((zone) => !isBlazarInternalAvailabilityZone(zone.zoneName))
          .map((zone) => zone.zoneName)
          .filter((zone) => !!zone),
      });
    } catch (e) {
      this.setState({
        availabilityZones: [],
      });
    } finally {
      this.setState({ availabilityZoneLoading: false });
    }
  };

  fetchFlavors = async () => {
    this.setState({ flavorLoading: true });
    try {
      const result = await client.nova.flavors.listDetail();
      this.setState({
        flavors: result.flavors || [],
      });
    } catch (e) {
      this.setState({
        flavors: [],
      });
    } finally {
      this.setState({ flavorLoading: false });
    }
  };

  fetchNetworks = async () => {
    this.setState({ networkLoading: true });
    try {
      const result = await client.neutron.networks.list();
      this.setState({
        networks: (result.networks || []).filter(isExternalNetwork),
      });
    } catch (e) {
      this.setState({
        networks: [],
      });
    } finally {
      this.setState({ networkLoading: false });
    }
  };

  fetchHostCount = async () => {
    this.setState({ hostCountLoading: true });
    try {
      const result = await client.blazar.hosts.list();
      const hosts = result.hosts || result['os-hosts'] || [];
      this.setState({ hostCount: hosts.length });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch Blazar host count', e);
      this.setState({ hostCount: null });
    } finally {
      this.setState({ hostCountLoading: false });
    }
  };

  getDefaultReservation = (resourceType) => {
    if (resourceType === RESERVATION_TYPES.FLAVOR_INSTANCE) {
      return {
        resource_type: resourceType,
        amount: 1,
      };
    }
    if (resourceType === RESERVATION_TYPES.FLOATING_IP) {
      return {
        resource_type: resourceType,
        amount: 1,
      };
    }
    return {
      resource_type: RESERVATION_TYPES.HOST,
      min: 1,
      max: 1,
    };
  };

  triggerChange = (reservations) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(reservations);
    }
  };

  updateReservation = (index, patch) => {
    const reservations = this.reservations.map((it, i) =>
      i === index ? { ...it, ...patch } : it
    );
    this.triggerChange(reservations);
  };

  onTypeChange = (index, resourceType) => {
    const current = this.reservations[index] || {};
    const nextReservation = {
      id: current.id,
      ...this.getDefaultReservation(resourceType),
    };
    const reservations = this.reservations.map((it, i) =>
      i === index ? nextReservation : it
    );
    this.triggerChange(reservations);
  };

  addReservation = () => {
    const type = this.hasHostReservation
      ? RESERVATION_TYPES.FLAVOR_INSTANCE
      : RESERVATION_TYPES.FLOATING_IP;
    this.triggerChange([
      ...this.reservations,
      this.getDefaultReservation(type),
    ]);
  };

  removeReservation = (index) => {
    const next = this.reservations.filter((it, i) => i !== index);
    this.triggerChange(next.length ? next : [this.getDefaultReservation()]);
  };

  getTypeOptions = (reservation) =>
    reservationTypeOptions.map((option) => {
      const disableHost =
        option.value === RESERVATION_TYPES.HOST &&
        (this.reservations.length > 1 ||
          (this.hasHostReservation &&
            reservation.resource_type !== RESERVATION_TYPES.HOST));
      return {
        ...option,
        disabled: disableHost,
      };
    });

  renderLabel(label) {
    return <div style={labelStyle}>{label}</div>;
  }

  renderTypeSelector(reservation, index) {
    const { disabled, isEdit } = this.props;
    return (
      <Select
        value={reservation.resource_type}
        disabled={disabled || isEdit}
        onChange={(value) => this.onTypeChange(index, value)}
        style={controlStyle}
      >
        {this.getTypeOptions(reservation).map((option) => (
          <Option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </Option>
        ))}
      </Select>
    );
  }

  renderHostCountHint(value) {
    const { hostCount, hostCountLoading } = this.state;
    if (hostCountLoading) {
      return (
        <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
          {t('Loading available hosts...')}
        </div>
      );
    }
    if (hostCount === null) {
      return null;
    }
    const num = Number(value);
    if (num > hostCount) {
      return (
        <div style={{ marginTop: 4, color: '#faad14', fontSize: 12 }}>
          {t('Only {count} host(s) registered in Blazar.', {
            count: hostCount,
          })}
        </div>
      );
    }
    return (
      <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
        {t('{count} host(s) available', { count: hostCount })}
      </div>
    );
  }

  renderHostFields(reservation, index) {
    const { disabled } = this.props;
    const { availabilityZoneLoading, availabilityZones } = this.state;
    return (
      <>
        <Col span={8}>
          {this.renderLabel(t('Minimum Hosts'))}
          <InputNumber
            min={1}
            value={reservation.min}
            disabled={disabled}
            onChange={(value) => this.updateReservation(index, { min: value })}
            style={controlStyle}
          />
          {this.renderHostCountHint(reservation.min)}
        </Col>
        <Col span={8}>
          {this.renderLabel(t('Maximum Hosts'))}
          <InputNumber
            min={reservation.min || 1}
            value={reservation.max}
            disabled={disabled}
            onChange={(value) => this.updateReservation(index, { max: value })}
            style={controlStyle}
          />
          {this.renderHostCountHint(reservation.max)}
        </Col>
        <Col span={8}>
          {this.renderLabel(t('Availability Zone'))}
          <Select
            allowClear
            showSearch
            optionFilterProp="children"
            loading={availabilityZoneLoading}
            value={reservation.availability_zone}
            disabled={disabled}
            onChange={(value) =>
              this.updateReservation(index, {
                availability_zone: value,
              })
            }
            style={controlStyle}
          >
            {availabilityZones.map((zone) => (
              <Option key={zone} value={zone}>
                {zone}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          {this.renderLabel(t('CPU Cores'))}
          <Input.Group compact style={controlStyle}>
            <Select
              value={reservation.vcpus_op || '>='}
              disabled={disabled}
              onChange={(value) =>
                this.updateReservation(index, { vcpus_op: value })
              }
              style={{ width: '30%' }}
            >
              {HYPERVISOR_OPERATORS.map((op) => (
                <Option key={op} value={op}>
                  {op}
                </Option>
              ))}
            </Select>
            <InputNumber
              min={1}
              value={reservation.vcpus}
              disabled={disabled}
              onChange={(value) =>
                this.updateReservation(index, { vcpus: value })
              }
              style={{ width: '70%' }}
            />
          </Input.Group>
        </Col>
        <Col span={8}>
          {this.renderLabel(t('RAM MB'))}
          <Input.Group compact style={controlStyle}>
            <Select
              value={reservation.memory_mb_op || '>='}
              disabled={disabled}
              onChange={(value) =>
                this.updateReservation(index, { memory_mb_op: value })
              }
              style={{ width: '30%' }}
            >
              {HYPERVISOR_OPERATORS.map((op) => (
                <Option key={op} value={op}>
                  {op}
                </Option>
              ))}
            </Select>
            <InputNumber
              min={1}
              value={reservation.memory_mb}
              disabled={disabled}
              onChange={(value) =>
                this.updateReservation(index, { memory_mb: value })
              }
              style={{ width: '70%' }}
            />
          </Input.Group>
        </Col>
        <Col span={8}>
          {this.renderLabel(t('Disk GB'))}
          <Input.Group compact style={controlStyle}>
            <Select
              value={reservation.local_gb_op || '>='}
              disabled={disabled}
              onChange={(value) =>
                this.updateReservation(index, { local_gb_op: value })
              }
              style={{ width: '30%' }}
            >
              {HYPERVISOR_OPERATORS.map((op) => (
                <Option key={op} value={op}>
                  {op}
                </Option>
              ))}
            </Select>
            <InputNumber
              min={1}
              value={reservation.local_gb}
              disabled={disabled}
              onChange={(value) =>
                this.updateReservation(index, { local_gb: value })
              }
              style={{ width: '70%' }}
            />
          </Input.Group>
        </Col>
        <Col span={12}>
          {this.renderLabel(t('Host Capabilities Extra Specs'))}
          <TextArea
            rows={4}
            value={reservation.extra_specs}
            disabled={disabled}
            placeholder={`Example\nkey=value\ngpu=True`}
            onChange={(e) =>
              this.updateReservation(index, { extra_specs: e.target.value })
            }
          />
          <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
            {t(
              'One key=value per line (no commas). Keys are custom capabilities set on hosts via "openstack reservation host set --extra <key>=<value>". Example: gpu=True'
            )}
          </div>
        </Col>
        <Col span={12}>
          {this.renderLabel(t('Before End Action'))}
          <Select
            allowClear
            value={reservation.before_end}
            disabled={disabled}
            onChange={(value) =>
              this.updateReservation(index, { before_end: value })
            }
            style={controlStyle}
          >
            {beforeEndOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>
      </>
    );
  }

  renderFlavorFields(reservation, index) {
    const { disabled } = this.props;
    const { flavors, flavorLoading } = this.state;
    return (
      <>
        <Col span={16}>
          {this.renderLabel(t('Flavor'))}
          <Select
            showSearch
            optionFilterProp="children"
            loading={flavorLoading}
            value={reservation.flavor_id}
            disabled={disabled}
            onChange={(value) =>
              this.updateReservation(index, { flavor_id: value })
            }
            style={controlStyle}
          >
            {flavors.map((flavor) => (
              <Option key={flavor.id} value={flavor.id}>
                {flavor.name ? `${flavor.name} (${flavor.id})` : flavor.id}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          {this.renderLabel(t('Amount'))}
          <InputNumber
            min={1}
            value={reservation.amount}
            disabled={disabled}
            onChange={(value) =>
              this.updateReservation(index, { amount: value })
            }
            style={controlStyle}
          />
        </Col>
      </>
    );
  }

  renderFloatingIpFields(reservation, index) {
    const { disabled, isEdit } = this.props;
    const { networks, networkLoading } = this.state;
    return (
      <>
        <Col span={16}>
          {this.renderLabel(t('Network'))}
          <Select
            showSearch
            optionFilterProp="children"
            loading={networkLoading}
            value={reservation.network_id}
            disabled={disabled || isEdit}
            onChange={(value) =>
              this.updateReservation(index, { network_id: value })
            }
            style={controlStyle}
          >
            {networks.map((network) => (
              <Option key={network.id} value={network.id}>
                {network.name ? `${network.name} (${network.id})` : network.id}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          {this.renderLabel(t('Amount'))}
          <InputNumber
            min={1}
            value={reservation.amount}
            disabled={disabled}
            onChange={(value) =>
              this.updateReservation(index, { amount: value })
            }
            style={controlStyle}
          />
        </Col>
        {!isEdit && (
          <Col span={24}>
            {this.renderLabel(t('Required Floating IPs'))}
            <TextArea
              rows={3}
              value={reservation.required_floatingips_text}
              disabled={disabled}
              placeholder={'Example\n172.24.4.2\n172.24.4.3'}
              onChange={(e) =>
                this.updateReservation(index, {
                  required_floatingips_text: e.target.value,
                })
              }
            />
            <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
              {t(
                'One IP address per line. Leave empty to let Blazar assign floating IPs automatically from the selected network. Example: 172.24.4.2'
              )}
            </div>
          </Col>
        )}
        {isEdit && (
          <Col span={24}>
            <Checkbox
              checked={reservation.clear_required_floatingips}
              disabled={disabled}
              onChange={(e) =>
                this.updateReservation(index, {
                  clear_required_floatingips: e.target.checked,
                })
              }
            >
              {t('Clear required floating IP list')}
            </Checkbox>
          </Col>
        )}
      </>
    );
  }

  renderFields(reservation, index) {
    if (reservation.resource_type === RESERVATION_TYPES.FLAVOR_INSTANCE) {
      return this.renderFlavorFields(reservation, index);
    }
    if (reservation.resource_type === RESERVATION_TYPES.FLOATING_IP) {
      return this.renderFloatingIpFields(reservation, index);
    }
    return this.renderHostFields(reservation, index);
  }

  renderReservation(reservation, index) {
    const { disabled, isEdit } = this.props;
    const canRemove = !disabled && !isEdit && this.reservations.length > 1;
    return (
      <div
        key={`${reservation.id || index}-${reservation.resource_type}`}
        style={blockStyle}
        className="reservation-block"
      >
        <Row gutter={[12, 12]}>
          <Col span={canRemove ? 22 : 24}>
            {this.renderLabel(t('Reservation Type'))}
            {this.renderTypeSelector(reservation, index)}
          </Col>
          {canRemove && (
            <Col span={2}>
              {this.renderLabel(' ')}
              <Button
                icon={<DeleteOutlined />}
                onClick={() => this.removeReservation(index)}
              />
            </Col>
          )}
          {this.renderFields(reservation, index)}
        </Row>
      </div>
    );
  }

  renderAlert() {
    const { isEdit } = this.props;
    if (isEdit) {
      return null;
    }
    if (this.hasHostReservation) {
      return (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={t(
            'Compute host reservations must be created as a single-reservation lease.'
          )}
        />
      );
    }
    return null;
  }

  renderAddButton() {
    const { disabled, isEdit } = this.props;
    if (disabled || isEdit || this.hasHostReservation) {
      return null;
    }
    return (
      <Button icon={<PlusOutlined />} onClick={this.addReservation}>
        {t('Add Reservation')}
      </Button>
    );
  }

  render() {
    return (
      <>
        {this.renderAlert()}
        {this.reservations.map((reservation, index) =>
          this.renderReservation(reservation, index)
        )}
        {this.renderAddButton()}
      </>
    );
  }
}

ReservationInput.propTypes = {
  disabled: PropTypes.bool,
  isEdit: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.arrayOf(PropTypes.shape({})),
};

ReservationInput.defaultProps = {
  disabled: false,
  isEdit: false,
  onChange: null,
  value: [],
};

export default ReservationInput;
