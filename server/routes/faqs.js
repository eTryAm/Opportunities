import { createCrudRouter } from '../utils/createCrudRouter.js'; import { ROLES } from '../middleware/auth.js';
export default createCrudRouter({ table:'faqs', label:'faq', roles:ROLES.CONTENT, fields:['question','answer','category','sort_order','is_published'], required:['question','answer'], boolFields:['is_published'], defaultSort:'sort_order ASC, created_at ASC' });
