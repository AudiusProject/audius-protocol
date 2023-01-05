package server

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/db"
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {
	// setup
	os.Setenv("audius_db_url", "postgresql://postgres:postgres@localhost:5454/comtest?sslmode=disable")
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// run tests
	code := m.Run()

	// teardown
	defer db.Conn.Close()
	// _, err = db.Conn.Exec(`
	// CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
	// DECLARE
	// statements CURSOR FOR
	// SELECT tablename FROM pg_tables
	// WHERE tableowner = username AND schemaname = 'public';
	// BEGIN
	// FOR stmt IN statements LOOP
	// EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
	// END LOOP;
	// END;
	// $$ LANGUAGE plpgsql;
	// SELECT truncate_tables('postgres')
	// `)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// _, err = db.Conn.Exec("truncate table chat cascade")
	// if err != nil {
	// 	log.Fatal(err)
	// }

	os.Exit(code)
}
