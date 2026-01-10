-- Створюємо таблицю для глобальної статистики
CREATE TABLE IF NOT EXISTS global_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_downloads INTEGER DEFAULT 0,
    cpu_downloads INTEGER DEFAULT 0,
    gpu_downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Вставляємо початковий рядок
INSERT INTO global_stats (id, total_downloads, cpu_downloads, gpu_downloads)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Створюємо функцію для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_global_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Створюємо тригер
CREATE TRIGGER global_stats_updated_at
    BEFORE UPDATE ON global_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_global_stats_updated_at();

-- Дозволяємо публічний доступ для читання
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON global_stats
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public increment" ON global_stats
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
