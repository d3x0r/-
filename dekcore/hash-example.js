function hash(v) {
	console.log( "hash", v );
  var shasum = crypto.createHash('sha1');
	shasum.update(v);
	return shasum.digest('hex');
}

