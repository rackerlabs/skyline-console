// Copyright 2024 Rackspace
//
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

// HashMap mappings and thresholds can either apply a flat cost or a
// multiplier ("rate"), mirroring CloudKitty's hashmap module.
export const mappingTypes = {
  flat: t('Flat'),
  rate: t('Rate'),
};

export const mappingTypeOptions = Object.keys(mappingTypes).map((key) => ({
  label: mappingTypes[key],
  value: key,
}));

// Format a numeric rate for display. CloudKitty stores costs as unit-less
// floats; the display prefix/postfix (currency symbol, etc.) is deployment
// specific, so we keep it simple and configurable via GLOBAL_VARIABLES.
export const formatRate = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '-';
  }
  const prefix =
    (typeof GLOBAL_VARIABLES !== 'undefined' &&
      GLOBAL_VARIABLES.cloudkittyRatePrefix) ||
    '';
  const postfix =
    (typeof GLOBAL_VARIABLES !== 'undefined' &&
      GLOBAL_VARIABLES.cloudkittyRatePostfix) ||
    '';
  return `${prefix}${num.toFixed(5)}${postfix}`;
};
