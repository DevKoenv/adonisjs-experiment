// @ts-nocheck
/* eslint-disable */
// --------------------------------------------------
// This file is auto-generated by Tuyau. Do not edit manually !
// --------------------------------------------------

import type { MakeTuyauRequest, MakeTuyauResponse } from '@tuyau/utils/types'
import type { InferInput } from '@vinejs/vine/types'

type RegisterGetHead = {
  request: unknown
  response: MakeTuyauResponse<import('../app/controllers/Auth/registered_user_controller.ts').default['create'], false>
}
type RegisterPost = {
  request: MakeTuyauRequest<InferInput<typeof import('../app/validators/registered_user.ts')['createRegisteredUserValidator']>>
  response: MakeTuyauResponse<import('../app/controllers/Auth/registered_user_controller.ts').default['store'], true>
}
type LoginGetHead = {
  request: unknown
  response: MakeTuyauResponse<import('../app/controllers/Auth/authenticated_session_controller.ts').default['create'], false>
}
type LoginPost = {
  request: unknown
  response: MakeTuyauResponse<import('../app/controllers/Auth/authenticated_session_controller.ts').default['store'], false>
}
type LogoutDelete = {
  request: unknown
  response: MakeTuyauResponse<import('../app/controllers/Auth/authenticated_session_controller.ts').default['destroy'], false>
}
export interface ApiDefinition {
  'register': {
    '$url': {
    };
    '$get': RegisterGetHead;
    '$head': RegisterGetHead;
    '$post': RegisterPost;
  };
  'login': {
    '$url': {
    };
    '$get': LoginGetHead;
    '$head': LoginGetHead;
    '$post': LoginPost;
  };
  'logout': {
    '$url': {
    };
    '$delete': LogoutDelete;
  };
}
const routes = [
  {
    params: [],
    name: 'home',
    path: '/',
    method: ["GET","HEAD"],
    types: {} as unknown,
  },
  {
    params: [],
    name: 'register',
    path: '/register',
    method: ["GET","HEAD"],
    types: {} as RegisterGetHead,
  },
  {
    params: [],
    name: 'register.store',
    path: '/register',
    method: ["POST"],
    types: {} as RegisterPost,
  },
  {
    params: [],
    name: 'login',
    path: '/login',
    method: ["GET","HEAD"],
    types: {} as LoginGetHead,
  },
  {
    params: [],
    name: 'login.store',
    path: '/login',
    method: ["POST"],
    types: {} as LoginPost,
  },
  {
    params: [],
    name: 'dashboard',
    path: '/dashboard',
    method: ["GET","HEAD"],
    types: {} as unknown,
  },
  {
    params: [],
    name: 'logout',
    path: '/logout',
    method: ["DELETE"],
    types: {} as LogoutDelete,
  },
] as const;
export const api = {
  routes,
  definition: {} as ApiDefinition
}
declare module '@tuyau/inertia/types' {
  type InertiaApi = typeof api
  export interface Api extends InertiaApi {}
}
