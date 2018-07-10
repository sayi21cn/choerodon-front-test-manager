import { stores, axios } from 'choerodon-front-boot';

const { AppState } = stores;
export function getCycle() {
  return axios.get('/test/v1/cycle/case/query/one/1');
}
export function getStatusList(statusType) {
  const projectId = AppState.currentMenuType.id;
  return axios.post('/test/v1/status/query', { statusType, projectId });
}
export function getUsers(param) {
  const projectId = AppState.currentMenuType.id;
  if (param) {
    return axios.get(`/test/v1/user/${projectId}/users?param=${param}`);
  }
  return axios.get(`/test/v1/user/${projectId}/users`);
}
export function editCycle(cycle) {
  const projectId = AppState.currentMenuType.id;
  return axios.post(`/test/v1/cycle/case/${projectId}/update`, cycle);
}
export function editCycleSide(data) {
  const axiosConfig = {
    headers: { 'content-type': 'multipart/form-datal' },
  };
  return axios.post('/test/v1/cycle/case/step/updateWithAttach', data, axiosConfig);
}
export function getCycleDetails(pagination, cycleCaseId) {
  const { size, page } = pagination;
  return axios.get(`/test/v1/cycle/case/step/query/${cycleCaseId}?size=${size}&page=${page}`);
}
export function getCycleHistiorys(pagination, cycleCaseId) {
  const { size, page } = pagination;
  return axios.get(`/test/v1/cycle/case/history/${cycleCaseId}?size=${size}&page=${page}`);
}
export function deleteAttachment(id) {
  return axios.delete(`/test/v1/project/test/case/attachment?bucketName=${'test'}&attachId=${id}`);
}