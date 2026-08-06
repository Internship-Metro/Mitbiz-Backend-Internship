import { z } from 'zod';
import { CreateRoleBaseSchema, roleRefinement, roleRefinementMessage } from './create-role.dto';

export const UpdateRoleDto = CreateRoleBaseSchema.partial().refine(roleRefinement, roleRefinementMessage);

export type UpdateRoleType = z.infer<typeof UpdateRoleDto>;
