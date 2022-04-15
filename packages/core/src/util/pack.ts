const IDS = {
	INTEGER: 0,
	DOUBLE: 1,
	FLOAT: 2,
	STRING: 3,
	BINARY: 4,
};
class Pack {
	constructor(structure, web = false, endianess = 'little', stringSize = 2) {
		this.web = web;
		this.bigEndian = endianess === 'big';
		this.stringSize = stringSize;
		this.stringMax = Math.pow(2, stringSize * 8) - 1;
		if (web) {
			this.string_write = `setUint${stringSize * 8}`;
			this.string_read = `getUint${stringSize * 8}`;
		} else {
			this.string_write = `writeUInt${stringSize * 8}${
				this.bigEndian ? 'BE' : 'LE'
			}`;
			this.string_read = `readUInt${stringSize * 8}${
				this.bigEndian ? 'BE' : 'LE'
			}`;
		}
		this.structure = structure.map(entry => {
			const o = {name: entry, unsigned: entry.startsWith('u')};
			if (entry.startsWith('u') || entry.startsWith('i')) {
				o.type = IDS.INTEGER;
				const number = entry.substr(o.unsigned ? 4 : 3);
				o.bitSize = Number.parseInt(number);
				o.byteSize = o.bitSize / 8;
			} else if (entry === 'string') {
				o.byteSize = null;
				o.type = IDS.STRING;
			} else if (entry === 'binary') {
				o.byteSize = null;
				o.type = IDS.BINARY;
			} else if (entry === 'double') {
				o.type = IDS.DOUBLE;
				o.byteSize = 8;
			} else if (entry === 'float') {
				o.type = IDS.FLOAT;
				o.byteSize = 4;
			} else {
				throw new Error(`Unknown type ${entry}`);
			}
			if (o.type !== IDS.STRING) {
				o.functions = this._getFuncNames(o.bitSize, o.unsigned, o.type);
			}
			return o;
		});
	}
	_getByteSize(structEntry, value) {
		if (structEntry.type === IDS.STRING || structEntry.type === IDS.BINARY)
			return value.length + this.stringSize;
		return structEntry.byteSize;
	}
	pack(values) {
		const web = this.web;
		if (values.length !== this.structure.length) return null;
		const sizes = [];
		let totalSize = 0;
		const cpy = [...values];
		for (let i = 0; i < this.structure.length; i++) {
			const entry = this.structure[i];
			const value = cpy[i];
			if (entry.type === IDS.STRING) {
				if (this.web && !this._encoder) this._encoder = new TextEncoder();
				cpy[i] = this.web
					? this._encoder.encode(value)
					: Buffer.from(value, 'utf-8');
				if (cpy[i].length > this.stringMax)
					throw new Error('string length over max!');
			}
			const elemSize = this._getByteSize(entry, cpy[i]);
			totalSize += elemSize;
			sizes.push(elemSize);
		}
		const state = {};
		if (web) {
			const buffer = new ArrayBuffer(totalSize);
			state.buffer = new Uint8Array(buffer);
			state.raw = buffer;
			state.view = new DataView(buffer);
		} else {
			state.buffer = Buffer.alloc(totalSize);
			state.raw = state.buffer;
		}
		let offset = 0;
		for (let i = 0; i < this.structure.length; i++) {
			const entry = this.structure[i];
			const value = cpy[i];
			this._packValue(state, entry, value, offset);
			offset += sizes[i];
		}
		return state.raw;
	}

	unpack(buffer) {
		const web = this.web;
		const state = {};
		const values = [];

		if (web) {
			state.buffer = new Uint8Array(buffer);
			state.raw = buffer;
			state.view = new DataView(buffer);
		} else {
			state.buffer = buffer;
			state.raw = state.buffer;
		}

		let offset = 0;
		for (let i = 0; i < this.structure.length; i++) {
			const entry = this.structure[i];

			if (entry.type === IDS.STRING) {
				const bufferValue = this._parseValue(state, entry, offset);

				if (web && !this._decoder) {
					this._decoder = new TextDecoder();
				}

				const string = web
					? this._decoder.decode(bufferValue)
					: bufferValue.toString('utf-8');

				values.push(string);
				offset += bufferValue.length + this.stringSize;
			} else if (entry.type === IDS.BINARY) {
				const bufferValue = this._parseValue(state, entry, offset);

				values.push(bufferValue);
				offset += bufferValue.length + this.stringSize;
			} else {
				const size = this._getByteSize(entry);

				values.push(this._parseValue(state, entry, offset));
				offset += size;
			}
		}
		return values;
	}

	_parseValue(buffer, structEntry, offset) {
		const web = this.web;
		if (structEntry.type === IDS.STRING || structEntry.type === IDS.BINARY) {
			let length;
			if (web) length = buffer.view[this.string_read](offset, !this.bigEndian);
			else length = buffer.buffer[this.string_read](offset);

			return buffer.buffer.subarray(
				offset + this.stringSize,
				offset + this.stringSize + length,
			);
		}
		if (
			structEntry.type === IDS.INTEGER ||
			structEntry.type === IDS.FLOAT ||
			structEntry.type === IDS.DOUBLE
		) {
			if (web)
				return buffer.view[structEntry.functions.read](offset, !this.bigEndian);
			else return buffer.buffer[structEntry.functions.read](offset);
		}
		return null;
	}
	_getFuncNames(number, unsigned, type) {
		const web = this.web;
		if (type === IDS.FLOAT) {
			if (web) return {read: 'getFloat32', write: 'setFloat32'};
			else
				return {
					write: `writeFloat${this.bigEndian ? 'BE' : 'LE'}`,
					read: `readFloat${this.bigEndian ? 'BE' : 'LE'}`,
				};
		}
		if (type === IDS.DOUBLE) {
			if (web) return {read: 'getFloat64', write: 'setFloat64'};
			else
				return {
					write: `writeDouble${this.bigEndian ? 'BE' : 'LE'}`,
					read: `readDouble${this.bigEndian ? 'BE' : 'LE'}`,
				};
		} else if (type === IDS.INTEGER) {
			if (web)
				return {
					write: `set${number === 64 ? 'Big' : ''}${
						unsigned ? 'Uint' : 'Int'
					}${number}`,
					read: `get${number === 64 ? 'Big' : ''}${
						unsigned ? 'Uint' : 'Int'
					}${number}`,
				};
			else
				return {
					write: `write${number === 64 ? 'Big' : ''}${
						unsigned ? 'U' : ''
					}Int${number}${number !== 8 ? (this.bigEndian ? 'BE' : 'LE') : ''}`,
					read: `read${number === 64 ? 'Big' : ''}${
						unsigned ? 'U' : ''
					}Int${number}${number !== 8 ? (this.bigEndian ? 'BE' : 'LE') : ''}`,
				};
		}

		return null;
	}
	_packValue(buffer, structEntry, value, offset) {
		const web = this.web;

		if (structEntry.type === IDS.STRING || structEntry.type === IDS.BINARY) {
			if (web) {
				buffer.view[this.string_write](offset, value.length, !this.bigEndian);
				buffer.buffer.set(value, offset + this.stringSize);
			} else {
				buffer.buffer[this.string_write](value.length, offset);
				value.copy(buffer.buffer, offset + this.stringSize);
			}
			return true;
		}
		if (
			structEntry.type === IDS.INTEGER ||
			structEntry.type === IDS.FLOAT ||
			structEntry.type === IDS.DOUBLE
		) {
			if (web)
				buffer.view[structEntry.functions.write](
					offset,
					value,
					!this.bigEndian,
				);
			else buffer.buffer[structEntry.functions.write](value, offset);
			return true;
		}
		return false;
	}
}
export default Pack;
