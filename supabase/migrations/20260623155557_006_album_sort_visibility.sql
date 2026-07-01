
-- photos 테이블에 sort_order 추가
ALTER TABLE photos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- albums 테이블에 visibility, category 컬럼 추가
ALTER TABLE albums ADD COLUMN IF NOT EXISTS visibility VARCHAR(30) DEFAULT '전체성도';
ALTER TABLE albums ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT '행사';

-- sort_order 인덱스
CREATE INDEX IF NOT EXISTS idx_photos_album_order ON photos(album_id, sort_order);
