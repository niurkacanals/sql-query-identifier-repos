import { expect } from 'chai';

import { identify } from '../../src';


/* eslint prefer-arrow-callback: 0 */
describe('identifier', function () {
  describe('given queries with a single statement', function () {
    it('should identify "SELECT" statement', function () {
      const actual = identify('SELECT * FROM Persons');
      const expected = ['SELECT'];

      expect(actual).to.eql(expected);
    });

    it('should identify "CREATE TABLE" statement', function () {
      const actual = identify('CREATE TABLE Persons (PersonID int, Name varchar(255));');
      const expected = ['CREATE_TABLE'];

      expect(actual).to.eql(expected);
    });

    it('should identify "CREATE DATABASE" statement', function () {
      const actual = identify('CREATE DATABASE Profile;');
      const expected = ['CREATE_DATABASE'];

      expect(actual).to.eql(expected);
    });

    it('should identify "INSERT" statement', function () {
      const actual = identify('INSERT INTO Persons (PersonID, Name) VALUES (1, \'Jack\');');
      const expected = ['INSERT'];

      expect(actual).to.eql(expected);
    });

    it('should identify "UPDATE" statement', function () {
      const actual = identify('UPDATE Persons SET Name = \'John\' WHERE PersonID = 1;');
      const expected = ['UPDATE'];

      expect(actual).to.eql(expected);
    });

    it('should identify "DELETE" statement', function () {
      const actual = identify('DELETE FROM Persons WHERE PersonID = 1;');
      const expected = ['DELETE'];

      expect(actual).to.eql(expected);
    });
  });
});

