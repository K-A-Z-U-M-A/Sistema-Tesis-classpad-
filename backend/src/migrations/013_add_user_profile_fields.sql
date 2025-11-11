-- Migration to add user profile fields
-- Adds: location, birth_date, age, gender, phone to users table

-- Add location field (text field for address)
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;

-- Add birth_date field
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add age field (will be calculated automatically)
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add gender field (only 'masculino' or 'femenino')
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IS NULL OR gender IN ('masculino', 'femenino'));

-- Add phone field (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create index for faster lookups by phone (without UNIQUE constraint to allow NULLs)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Create function to calculate age from birth_date
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function to automatically update age when birth_date changes
CREATE OR REPLACE FUNCTION update_user_age()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.birth_date IS NOT NULL THEN
        NEW.age := calculate_age(NEW.birth_date);
    ELSE
        NEW.age := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update age
DROP TRIGGER IF EXISTS trigger_update_user_age ON users;
CREATE TRIGGER trigger_update_user_age
    BEFORE INSERT OR UPDATE OF birth_date ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_age();

-- Update existing users with birth_date to calculate their age
UPDATE users
SET age = calculate_age(birth_date)
WHERE birth_date IS NOT NULL AND age IS NULL;


