import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateLabelInput, Label, UpdateLabelInput } from '@/types';

export async function getLabels(db: SQLiteDatabase): Promise<Label[]> {
  return db.getAllAsync<Label>('SELECT * FROM labels ORDER BY name ASC');
}

export async function getLabelsByOrderId(db: SQLiteDatabase, orderId: number): Promise<Label[]> {
  return db.getAllAsync<Label>(
    `SELECT l.* FROM labels l
     INNER JOIN order_labels ol ON ol.label_id = l.id
     WHERE ol.order_id = ?
     ORDER BY l.name ASC`,
    [orderId]
  );
}

export async function createLabel(db: SQLiteDatabase, input: CreateLabelInput): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO labels (name, color, created_at) VALUES (?, ?, ?)',
    [input.name, input.color, now]
  );
  return result.lastInsertRowId;
}

export async function updateLabel(db: SQLiteDatabase, id: number, input: UpdateLabelInput): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
  if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE labels SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteLabel(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM labels WHERE id = ?', [id]);
}

export async function setOrderLabels(db: SQLiteDatabase, orderId: number, labelIds: number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM order_labels WHERE order_id = ?', [orderId]);
    for (const labelId of labelIds) {
      await db.runAsync(
        'INSERT INTO order_labels (order_id, label_id) VALUES (?, ?)',
        [orderId, labelId]
      );
    }
  });
}
