import { deleteAsync } from 'del';

await deleteAsync(['dist/*'], { force: true });