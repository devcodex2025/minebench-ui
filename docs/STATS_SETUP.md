# Інструкція з налаштування таблиці global_stats

## Крок 1: Створіть таблицю в Supabase

1. Зайдіть в Supabase Dashboard: https://app.supabase.com
2. Виберіть ваш проєкт
3. Перейдіть до **SQL Editor**
4. Скопіюйте вміст файлу `supabase/migrations/001_create_global_stats.sql`
5. Вставте в SQL Editor і натисніть **Run**

## Крок 2: Перевірте створення таблиці

```sql
SELECT * FROM global_stats;
```

Ви маєте побачити один рядок з:
- id: 1
- total_downloads: 0
- cpu_downloads: 0
- gpu_downloads: 0
- created_at: (поточна дата)
- updated_at: (поточна дата)

## Крок 3: Тестування

Після деплою коду, перевірте що:
1. На головній сторінці відображається статистика завантажень з таблиці `global_stats`
2. При кліку на кнопку Download на сторінці /downloads - лічильник збільшується
3. Можна перевірити в Supabase Dashboard: `SELECT * FROM global_stats;`

## Структура таблиці

| Поле | Тип | Опис |
|------|-----|------|
| id | INTEGER | Завжди = 1 (обмеження) |
| total_downloads | INTEGER | Загальна кількість завантажень |
| cpu_downloads | INTEGER | Кількість завантажень CPU версії |
| gpu_downloads | INTEGER | Кількість завантажень GPU версії |
| created_at | TIMESTAMP | Дата створення |
| updated_at | TIMESTAMP | Дата останнього оновлення (автоматично) |
