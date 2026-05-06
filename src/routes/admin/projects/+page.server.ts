import { projectsResource } from '$lib/server/cms/projects';

export const load = projectsResource.list.load;
export const actions = projectsResource.list.actions;
