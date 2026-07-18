// Copyright 2021 99cloud
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

// Helpers for the Basic / Advanced console mode selection.
//
// The mode is persisted in localStorage so it survives reloads and is
// available to the header toggle, the post-login redirect, and any
// route guards.

import { getLocalStorageItem, setLocalStorageItem } from 'utils/local-storage';

export const CONSOLE_MODE_KEY = 'console_mode';

export const MODE_BASIC = 'basic';
export const MODE_ADVANCED = 'advanced';

// Landing routes for each mode. Advanced keeps the existing overview
// so nothing regresses; Basic points at the new lightweight home we
// are building out.
export const MODE_HOME_PATH = {
  [MODE_BASIC]: '/base/basic-home',
  [MODE_ADVANCED]: '/base/overview',
};

export const MODE_SELECT_PATH = '/mode-select';

export const isValidMode = (value) =>
  value === MODE_BASIC || value === MODE_ADVANCED;

export const getConsoleMode = () => {
  const value = getLocalStorageItem(CONSOLE_MODE_KEY);
  return isValidMode(value) ? value : null;
};

export const setConsoleMode = (mode) => {
  if (!isValidMode(mode)) {
    return;
  }
  setLocalStorageItem(CONSOLE_MODE_KEY, mode);
};

export const getHomePathForMode = (mode) =>
  MODE_HOME_PATH[mode] || MODE_HOME_PATH[MODE_ADVANCED];
