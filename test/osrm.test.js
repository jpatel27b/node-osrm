var osrm = require('../');
var assert = require('assert');

describe('osrm', function() {

    it('should throw if new keyword is not used', function(done) {
        assert.throws(function() { osrm.Options(); },
          /Cannot call constructor as function, you need to use 'new' keyword/);
        assert.throws(function() { osrm.Query(); },
          /Cannot call constructor as function, you need to use 'new' keyword/);
        assert.throws(function() { osrm.Engine(); },
          /Cannot call constructor as function, you need to use 'new' keyword/);
        done();
    });

    it('should throw if invalid args are passed', function(done) {
        assert.throws(function() { new osrm.Options(99999); },
        /OSRM config path must be a string/);
        done();
    });

    it.skip('should throw if ini file is blank', function(done) {
        assert.throws(function() { new osrm.Options("./test/data/bogus.ini"); },
        /\.\/test\/data\/bogus.ini is empty/);
        done();
    });

    // @TODO - should provide better error:
    // https://github.com/DennisOSRM/Project-OSRM/commit/34735b8aad06098d09d3fb907137697799a281e4#commitcomment-3809465
    it.skip('should throw if ini file does not exist', function(done) {
        assert.throws(function() { new osrm.Options("doesnotexist.ini"); },
        /doesnotexist.ini not found/);
        done();
    });

    it.skip('should throw if files referenced by ini do not exist', function(done) {
        assert.throws(function() { new osrm.Options("./test/data/references-missing-files.ini"); },
        /doesnotexist.hsgr not found/);
        done();
    });

    it.skip('should throw if ini references corrupt files', function(done) {
        assert.throws(function() { new osrm.Options("./test/data/references-corrupt-files.ini"); },
        /hsgr file is empty/);
        done();
    });

    it('should be initialized', function(done) {
        var opts = new osrm.Options("./test/data/berlin.ini");
        assert.ok(opts);
        done();
    });

    it('should throw if insufficient coordinates given', function() {
        assert.throws(function() {
            new osrm.Query({coordinates: []});
        });
    });

    it('should return results for berlin using sync api', function(done) {
        var opts = new osrm.Options("./test/data/berlin.ini");
        var engine = new osrm.Engine(opts);
        var query = new osrm.Query({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]});
        var sync_result = engine.run(query);
        engine.run(query,function(err,async_result) {
            assert.equal(sync_result,async_result);
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            done();
        });
    });

    it('should return results for berlin using sync api and shared memory', function(done) {
        var opts = new osrm.Options("./test/data/berlin.ini",true);
        var engine = new osrm.Engine(opts);
        var query = new osrm.Query({coordinates: [[52.519930,13.438640], [52.513191,13.415852]]});
        var sync_result = engine.run(query);
        engine.run(query,function(err,async_result) {
            assert.equal(sync_result,async_result);
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            done();
        });
    });

    it('should return results for berlin using options', function(done) {
        var opts = new osrm.Options("./test/data/berlin.ini");
        var engine = new osrm.Engine(opts);
        var query = new osrm.Query({
            coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
            zoomLevel: 17,
            alternateRoute: false,
            printInstructions: false
        });
        engine.run(query,function(err,async_result) {
            var result_json = JSON.parse(async_result);
            assert.equal(result_json.status_message,'Found route between points');
            assert.equal(0, result_json.route_instructions.length, "instructions should be empty");
            assert.equal(0, result_json.alternative_geometries.length, "alternative_geometries should be empty");
            done();
        });
    });

    it('should return results for berlin using hints', function(done) {
        var opts = new osrm.Options("./test/data/berlin.ini");
        var engine = new osrm.Engine(opts);
        var query = new osrm.Query({
            coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
            alternateRoute: false,
            printInstructions: false
        });
        engine.run(query,function(err,first_result) {
            var result_json = JSON.parse(first_result);
            assert.equal(result_json.status_message,'Found route between points');
            var checksum = result_json.hint_data.checksum;
            assert.equal("number", typeof(checksum), "checksum should be a number");

            var query2 = new osrm.Query({
                coordinates: [[52.519930,13.438640], [52.513191,13.415852]],
                hints: result_json.hint_data.locations,
                alternateRoute: false,
                printInstructions: false,
                checksum: checksum
            });
            engine.run(query2,function(err,second_result) {
                assert.equal(first_result,second_result);
                var result_json = JSON.parse(second_result);
                assert.equal(result_json.status_message,'Found route between points');
                done();
            });
        });
    });
});
