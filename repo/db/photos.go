package db

import (
	"database/sql"
	"strconv"
	"sync"
	"time"

	"github.com/textileio/textile-go/repo"
	"github.com/textileio/textile-go/repo/wallet"
)

type PhotoDB struct {
	modelStore
}

func NewPhotoStore(db *sql.DB, lock *sync.Mutex) repo.PhotoStore {
	return &PhotoDB{modelStore{db, lock}}
}

func (c *PhotoDB) Put(cid string, lastCid string, md *wallet.PhotoData) error {
	c.lock.Lock()
	defer c.lock.Unlock()

	tx, err := c.db.Begin()
	if err != nil {
		return err
	}
	stm := `insert into photos(cid, lastCid, name, ext, created, added, latitude, longitude) values(?,?)`
	stmt, err := tx.Prepare(stm)
	if err != nil {
		return err
	}

	defer stmt.Close()
	_, err = stmt.Exec(
		cid,
		lastCid,
		md.Name,
		md.Ext,
		int(md.Created.Unix()),
		int(md.Added.Unix()),
		md.Latitude,
		md.Longitude,
	)
	if err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}

func (c *PhotoDB) GetPhotos(offsetId string, limit int) []repo.PhotoSet {
	c.lock.Lock()
	defer c.lock.Unlock()
	var ret []repo.PhotoSet

	var stm string
	if offsetId != "" {
		stm = "select * from photos where added<(select added from photos where cid='" + offsetId + "') order by added desc limit " + strconv.Itoa(limit) + " ;"
	} else {
		stm = "select * from photos order by added desc limit " + strconv.Itoa(limit) + ";"
	}
	rows, err := c.db.Query(stm)
	if err != nil {
		log.Error("", err)
		return ret
	}
	for rows.Next() {
		var cid, name, ext, lastCid string
		var createdInt, addedInt int
		var latitude, longitude float64
		if err := rows.Scan(&cid, &lastCid, &name, &ext, &createdInt, &addedInt, &latitude, &longitude); err != nil {
			continue
		}
		created := time.Unix(int64(createdInt), 0)
		added := time.Unix(int64(addedInt), 0)
		photo := repo.PhotoSet{
			Cid:     cid,
			LastCid: lastCid,
			MetaData: wallet.PhotoData{
				Name:      name,
				Ext:       ext,
				Created:   created,
				Added:     added,
				Latitude:  latitude,
				Longitude: longitude,
			},
		}
		ret = append(ret, photo)
	}
	return ret
}

func (c *PhotoDB) DeletePhoto(cid string) error {
	c.lock.Lock()
	defer c.lock.Unlock()
	c.db.Exec("delete from photos where cid=?", cid)
	return nil
}
