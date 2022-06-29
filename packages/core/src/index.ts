import * as util from './util';

export {util};

const e = util.emitter<{
	SOMETHING: number;
	SOMETHING_ELSE: boolean;
}>();

e.on('SOMETHING', ({data}) => {
	data.toPrecision(2);
});

e.on('SOMETHING_ELSE', ({data}) => {
	data.valueOf();
});

e.emit('SOMETHING', 10);
e.emit('SOMETHING_ELSE', true);
